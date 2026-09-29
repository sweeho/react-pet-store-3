## Why

SWHR3-T-0048: the server answers 500 "database is locked" whenever another process (an operator script such as `db/grant-admin.ts` or `db/seed-orders.ts`, or a second server instance) holds the write lock on `sqlite.db`. Reproduced in isolation on this branch: `bun:sqlite` opens every connection with `busy_timeout = 0` and `journal_mode = delete`, so a write issued while another connection holds a RESERVED lock fails in 0 ms with `SQLiteError: database is locked`; the same write with `busy_timeout = 5000` waits for the lock (about 1.1 s in the repro) and succeeds. In rollback-journal mode readers also fail while the writer holds the EXCLUSIVE lock during commit, which is how a read-only path such as the admin role lookup (`lib/roles.ts` via `middleware/auth.ts`) surfaces the 500. `db/client.ts` sets neither pragma, and it also runs `migrate()` at import before any caller can set one, which is why `e2e/order-approval.spec.ts` currently carries a `retries: 3` override and `runBun` a retry loop.

The behaviour of the database under short concurrent writes was never specified, so this change adds it (SPEC-GAP) rather than modifying an existing requirement.

## What Changes

- `db/client.ts` configures every connection it opens, before `migrate()` runs: a 5000 ms busy timeout on all connections, and write-ahead logging on the file-backed database (not on the Vitest `:memory:` database).
- The connection setup is exposed as one exported function so the policy is testable against a temporary file.
- `e2e/order-approval.spec.ts` drops its `retries: 3` workaround and the comment that justifies it.

## Impact

- Capability: `order-approval` (ADDED requirement "Database lock contention tolerance"). The fix is connection-wide, so every database-backed route benefits, including customer-management registration and sign-in.
- Code: `db/client.ts`, a new server-project test under `lib/`, `e2e/order-approval.spec.ts`.
- Operations: WAL creates `sqlite.db-wal` / `sqlite.db-shm` beside the db (already gitignored) and requires the db on a local filesystem.
