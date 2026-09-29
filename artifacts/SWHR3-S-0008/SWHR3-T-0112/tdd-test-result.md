---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0112
---

# TDD result — SWHR3-T-0112

## Test cases

`lib/payment.test.ts` (orders written by `placeOrder`, stage PENDING):

| Case         | Test                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWHR3-C-0164 | `authorizePayment` writes one `payment_authorizations` row (processor `no-charge`, `NOCHARGE-` transaction id, six-character code, amount), sets the stage to PAID and adds one PAID history row |
| SWHR3-C-0165 | `noChargeAuthorizer.authorize(4111111111114412, 4548)` returns `approved: true` with an id and code, and `fetch` is never called                                                                 |
| n/a          | declines only `DECLINE_TEST_CARD`; distinct transaction ids; a decline throws `PaymentDeclinedError`, writes no row and leaves PENDING; an injected authorizer is used, and can decline any card |

`lib/errors.test.ts`: `PaymentDeclinedError` is 402 `PAYMENT_DECLINED` with the message "Your card was declined. No order was placed."

## Red run

`bun run test lib/payment.test.ts lib/errors.test.ts` against `VortexNotImplemented` stubs and no `PaymentDeclinedError`: 6 failed, 24 passed. The two "decline throws" tests pass in red only because the stub throws too (`toThrow` on an undefined class accepts any error); they pass for the right reason after the implementation. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 116 files, 800 tests passed. `bun run build` exit 0.

TDD-RESULT: 800 passed, 0 failed
