# Summary — SWHR3-T-0087

Added `placeOrder({ accountId, cartToken, locale, event }, outer?)` in `lib/checkout.ts` (C8, D4, D11). Inside `withTransaction(fn, outer, { behavior: "immediate" })` it calls `getCheckoutLines`, `toPurchaseOrder`, `insertPurchaseOrder`, then `empty(cartToken, tx)`, logs `checkout: order <id> placed by account <n>, <n> lines, <cents> cents` (no card data), and returns `{ orderId, orderDate (ISO), email }`.

Files: `lib/checkout.ts`, `lib/checkout.test.ts` (AC-1 via C-0139, C-0140; AC-2 via C-0141; plus an empty-cart case). No UI change, so no design consulted.

Note: the log line is written before the outermost commit, so an outer transaction that later rolls back would already have logged it.

Verification: red run 4 failed against the stub; `bun run verify` exit 0, 624 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
