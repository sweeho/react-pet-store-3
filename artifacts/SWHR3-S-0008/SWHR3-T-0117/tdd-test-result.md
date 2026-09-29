---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0117
---

# TDD result — SWHR3-T-0117

## Test cases

`lib/order-processing.test.ts`: SWHR3-C-0171 (one `ORDER_CONFIRMATION` row, `QUEUED`, recipient the billing email, payload with order id, two lines, total 4548 and `shipTo.city` "San Francisco", stage CONFIRMED); same return shape as `placeOrder` with one payment row; cart emptied; a declined card throws `PaymentDeclinedError` with no order, cart untouched and nothing logged; injected authorizer used; one log line after commit without card data; an outer transaction joined so its caller can roll everything back.

`lib/order-processing.modules.test.ts`: SWHR3-C-0182 (every collaborator module is statically imported and exposes its contract functions).

`routes/api/orders/index.post.test.ts`: SWHR3-C-0171 at the route (stage CONFIRMED, one payment row, one outbox row); a declined card answers 402 `PAYMENT_DECLINED` and creates nothing.

`lib/checkout.test.ts`: `placeOrderInTx` writes through the caller's transaction and does not log; existing `placeOrder` tests unchanged and passing.

## Red run

`bun run test lib/order-processing.test.ts lib/order-processing.modules.test.ts routes/api/orders/index.post.test.ts` with `processOrder` as a `VortexNotImplemented` stub, `placeOrderInTx` absent and the route still on `placeOrder`: 10 failed, 15 passed (the existing route tests). `a2a_run_tests` is refused on this project (no testEvidence block). The new `placeOrderInTx` test in `lib/checkout.test.ts` was added after the refactor and had no separate red run.

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 119 files, 813 tests passed. `bun run build` exit 0.

TDD-RESULT: 813 passed, 0 failed
