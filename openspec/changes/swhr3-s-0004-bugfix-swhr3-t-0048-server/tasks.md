## 1. Connection lock policy

- [x] 1.1 Add `openDatabase(file)` to `db/client.ts` setting `busy_timeout = 5000` first, WAL on the file-backed db, and `foreign_keys = ON`, and build the module's connection with it before `migrate()` (design.md D1-D3) (SWHR3-T-0048)
- [x] 1.2 Add a server-project test under `lib/` asserting the busy timeout and WAL on a temp file and the busy timeout on `:memory:` (design.md D3) (SWHR3-T-0048)
- [x] 1.3 Remove the `retries: 3` override and its comment from `e2e/order-approval.spec.ts`; the spec passes repeated four times with no retries (design.md D4) (SWHR3-T-0048)
