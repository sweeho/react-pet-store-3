## Context

Measured on this branch with two Bun processes against one temp file (SWHR3-T-0048 repro):

| Setting on the contending connection                     | Result of a write while another process holds `BEGIN IMMEDIATE` |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| Bun default: `busy_timeout = 0`, `journal_mode = delete` | `SQLiteError: database is locked` after 0 ms                    |
| `busy_timeout = 5000`                                    | waits, succeeds after ~1150 ms when the holder commits          |

`db/client.ts` constructs the `Database`, sets only `PRAGMA foreign_keys = ON`, then runs `migrate()` and the demo seed at import time. `db/seed-orders.ts` sets its own `busy_timeout = 10000`, but only after importing the client, so its import-time `migrate()` is unprotected; `db/grant-admin.ts` sets none. All three processes (dev server, seed script, grant script) share `sqlite.db` during E2E runs, which run fully parallel.

## Decisions

### D1 — 5000 ms busy timeout on every connection, set first

`db/client.ts` sets `PRAGMA busy_timeout = 5000` immediately after constructing the `Database`, before any other statement, including `migrate()` and the seed. It applies to `:memory:` too (harmless, and makes the policy uniform and assertable in Vitest). 5000 ms is well above the observed lock hold times (operator scripts are single short transactions) and well below Playwright's default 30 s test timeout, so a genuinely stuck lock still surfaces as a failure rather than a hang.

Alternative rejected: retrying at the route layer. It would have to be added to every route and does not cover `migrate()` or the operator scripts.

### D2 — WAL on the file-backed database only

After D1, when the database is file-backed (not `VITEST`), `db/client.ts` sets `PRAGMA journal_mode = WAL`. In WAL, readers never block on a writer and a writer never blocks readers, so read-only paths (role lookup, order queue) stop contending at all; D1 then only has to cover writer-vs-writer. WAL is persistent in the file, so later connections inherit it. `:memory:` is skipped because WAL does not apply there.

Consequences: `sqlite.db-wal` and `sqlite.db-shm` sidecars appear next to `sqlite.db` (already in `.gitignore`); the db must live on a local filesystem (not NFS/SMB). A deployment that backs up `sqlite.db` must copy the sidecars too or checkpoint first.

### D3 — One exported setup function, tested against a temp file

The construction and pragmas move into an exported `openDatabase(file: string): Database` in `db/client.ts` (returns the configured `bun:sqlite` `Database`; `file` is a path or `":memory:"`). The module's own connection is `openDatabase(VITEST ? ":memory:" : <cwd>/sqlite.db)`, then drizzle, `migrate()` and the seed exactly as today. `foreign_keys = ON` moves into `openDatabase` unchanged. A new test under `lib/` (the server Vitest project; tests under `db/` would run in jsdom and cannot load `bun:sqlite`) opens a temp file through `openDatabase` and asserts the pragmas, and asserts the busy timeout on a `:memory:` connection.

### D4 — Remove the E2E workaround, leave the script-level mitigations

`e2e/order-approval.spec.ts` loses `test.describe.configure({ retries: 3 })` and its comment; that override existed only for this defect. `runBun`'s retry loop and `db/seed-orders.ts`'s own `busy_timeout = 10000` are left as they are: they are harmless, outside this defect's blast radius, and the seed script's larger value only applies after the client's 5000 ms has already covered import time.

## Risks

- R1: a pre-existing `sqlite.db` opened concurrently by an old process may keep `delete` mode until a connection can take the lock to switch; D1 still covers contention in that state, so no code path should fail if the switch has not happened yet. Do not throw when `journal_mode` reads back as something other than `wal` on the shared connection.
- R2: a longer timeout delays failure on a genuinely stuck lock by up to 5 s instead of failing immediately.
