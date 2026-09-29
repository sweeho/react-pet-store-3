---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0095
---

# TDD result — SWHR3-T-0095

## Test cases

`routes/api/orders/index.post.test.ts` (real `H3Event` through `middleware/auth.ts` and `middleware/cart-session.ts`, real session cookie):

| Case         | Test                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| SWHR3-C-0131 | valid request places an order: card type, BILL_TO/SHIP_TO rows, two line items, cart emptied |
| SWHR3-C-0122 | `orders.account_id` is the signed-in account                                                 |
| SWHR3-C-0114 | `card_expiry` is `03/<year + 2>`                                                             |
| SWHR3-C-0101 | no address line 2 stores NULL in both contact rows                                           |
| SWHR3-C-0103 | blank `city_a`: 422, `missingFields ["city_a"]`, no order, cart unchanged                    |
| SWHR3-C-0142 | missing card number: 422, no order or contact rows, cart unchanged                           |
| SWHR3-C-0116 | no cart cookie: 409 `SHOPPING_CART_EMPTY`, "Shopping cart is empty", no order                |
| n/a          | signed out: 401                                                                              |

Supporting tests: `lib/protected-resources.test.ts` (`/api/orders` protected), `src/constants/protected-pages.test.ts` (`/checkout`), `middleware/cart-session.test.ts` (reads the cookie for `/api/orders`, never mints), `src/utils/orders-api.test.ts` (method, path, body, ApiError field errors), `lib/checkout-mirror.test.ts` (client mirror parity).

## Red run

`bun run test` over those six files, with the route and client binding as `VortexNotImplemented` stubs: 15 failed, 14 passed (the passing ones are unchanged existing tests in the same files). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 103 files, 643 tests passed. `bun run build` exit 0. The two edited `e2e/cart.spec.ts` tests were NOT run: no Chromium in this container.

TDD-RESULT: 643 passed, 0 failed
