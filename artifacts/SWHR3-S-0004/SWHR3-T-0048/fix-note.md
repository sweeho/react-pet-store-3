# Fix note: SWHR3-T-0048

**Root cause:** `db/client.ts` opened `bun:sqlite` with Bun defaults (busy_timeout 0, journal_mode delete) and set neither before `migrate()`. Any lock held by another process (operator scripts, second instance) failed at once with "database is locked", so routes answered 500.

**Fix:** exported `openDatabase(file)` applies `busy_timeout = 5000` first, then WAL (file-backed only, not asserted on read-back), then `foreign_keys = ON`. The shared connection is built through it, before drizzle/`migrate()`/seed. Removed the E2E `retries: 3` workaround.

**Files:**

- `db/client.ts`: add `openDatabase`, use it for the shared connection
- `lib/db-client.test.ts`: pragma, wait-and-succeed, and 5 s-failure tests (cases C-0038, C-0041, C-0042)
- `e2e/db-lock.spec.ts`: server-level cases C-0036, C-0037, C-0039, C-0040
- `e2e/order-approval.spec.ts`: removed retries override and comment
