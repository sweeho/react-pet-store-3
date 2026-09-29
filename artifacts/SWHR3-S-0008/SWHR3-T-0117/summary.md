---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0117
---

# Summary — SWHR3-T-0117

- `lib/checkout.ts`: extracted the transaction body of `placeOrder` into exported `placeOrderInTx(tx, input)` (no logging) and the log line into `logOrderPlaced`; `placeOrder` keeps its signature and behaviour (immediate transaction, one log line after commit).
- `lib/order-processing.ts`: `processOrder(input, options?, outer?)` runs `placeOrderInTx`, `authorizePayment` (stage PAID) and `queueOrderConfirmation` (stage CONFIRMED) in one immediate transaction, then logs once after commit. A decline or any failure rolls everything back and leaves the cart untouched.
- `routes/api/orders/index.post.ts`: uses `processOrder` instead of `placeOrder`; authentication and JSON-body order unchanged; a 402 comes through `toHttpError`.
- `lib/order-processing.modules.test.ts`: proves the collaborators (`checkout`, `payment`, `notifications`, `workflow-stage`, `inventory`, `supplier-pos`, `order-processing`) are static ES module imports exposing their contract functions (SD7: no runtime registry).

Files: `lib/checkout.ts`, `lib/checkout.test.ts`, `lib/order-processing.ts`, `lib/order-processing.test.ts`, `lib/order-processing.modules.test.ts`, `routes/api/orders/index.post.ts`, `routes/api/orders/index.post.test.ts`.

Note: `logOrderPlaced` is a small addition beyond the plan's "extraction only", so the log line stays defined in one place for both entry points.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0182]`; `[SWHR3-C-0171]` covers the confirmation and the wiring.

Verification: `bun run verify` exit 0 (813 tests), `bun run build` exit 0.
