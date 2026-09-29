# SWHR3-T-0048 — Server answers 500 "database is locked" when another process writes sqlite.db

Change: `swhr3-s-0004-bugfix-swhr3-t-0048-server` (read `design.md` first). Requirement: order-approval "Database lock contention tolerance".

## Objective

Every connection `db/client.ts` opens waits up to 5 s for a contended lock, and the file-backed db runs in WAL, so concurrent writes from operator scripts or another instance never surface as a 500. Root cause (reproduced): Bun's `bun:sqlite` defaults to `busy_timeout = 0` / `journal_mode = delete`, and `db/client.ts` sets neither (see design.md Context).

## Steps

1. In `db/client.ts`, add the exported `openDatabase(file: string): Database` per design.md D3, applying the pragmas in the order D1 then D2, plus the existing `foreign_keys = ON`. Honour design.md R1 (do not throw if WAL does not read back).
2. Build the module's `sqlite` connection through `openDatabase` so the pragmas precede `drizzle(...)`, `migrate()` and the seed. Keep the existing `db` export and its schema map unchanged.
3. Add `lib/db-client.test.ts` (server Vitest project, design.md D3) covering AC-1 and AC-2 against a temp file and `:memory:`; clean up the temp file and its `-wal`/`-shm` sidecars.
4. Remove `test.describe.configure({ retries: 3 })` and its comment from `e2e/order-approval.spec.ts` (design.md D4). Leave `runBun`'s retry loop and `db/seed-orders.ts` untouched.
5. Run the order-approval E2E spec repeated four times with no retries and confirm AC-3/AC-4; run the full gate.

## File/module ownership

| File                         | Change                                                             |
| ---------------------------- | ------------------------------------------------------------------ |
| `db/client.ts`               | modify: add `openDatabase`, route the shared connection through it |
| `lib/db-client.test.ts`      | create: pragma assertions                                          |
| `e2e/order-approval.spec.ts` | modify: remove the `retries: 3` override and its comment only      |

Not touched: `db/seed-orders.ts`, `db/grant-admin.ts`, `.gitignore` (sidecars already ignored), any route.

## Definition of Done

- AC-1 through AC-5 on SWHR3-T-0048 hold.
- Fixed interface contract: `db/client.ts` keeps exporting `db` with the same schema map; adds `export function openDatabase(file: string): Database` (bun:sqlite `Database`), whose returned connection has `busy_timeout = 5000`, `foreign_keys = ON`, and, for a non-`:memory:` file, `journal_mode = wal`.
