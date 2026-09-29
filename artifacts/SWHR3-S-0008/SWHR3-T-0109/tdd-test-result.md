---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0109
---

# TDD result — SWHR3-T-0109

## Test cases

All in `lib/order-processing.validation.test.ts`:

| Case         | Test                                                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0158 | `processOrder` with an empty or unknown cart token (and `undefined`) throws `ShoppingCartEmptyError` "Shopping cart is empty"; `orders`, `payment_authorizations` and `notification_outbox` counts unchanged                                                         |
| SWHR3-C-0159 | `POST /api/orders` (real `H3Event` through both middlewares) with no cart cookie answers 409 `SHOPPING_CART_EMPTY`; nothing created                                                                                                                                  |
| n/a          | nothing is logged for an empty cart; signed out answers 401 with nothing created and the cart unchanged; a blank `credit_card_number` and a blank `city_b` each answer 422 with that one field in `missingFields` and `fieldErrors`, nothing created, cart unchanged |

## Red run

None. This ticket proves preconditions that `processOrder` (T-0117), the checkout parser and the route already enforce, and the plan says to change no production file, so all six tests passed on first run. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 120 files, 819 tests passed (6 new).

TDD-RESULT: 819 passed, 0 failed
