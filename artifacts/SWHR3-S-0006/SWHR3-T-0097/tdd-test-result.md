---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0097
---

# TDD result — SWHR3-T-0097

## Test cases

`src/pages/checkout.test.tsx` (mocks `cart-api`, `orders-api` and `apiFetch`):

| Case         | Test                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0102 | 422 with `missingFields ["city_a","postal_code_a"]`: alert "Your order was not placed — 2 required fields are missing", list "Billing · City" and "Billing · Postal code", "Enter a city." beside City, typed given name and card number kept, focus on the summary |
| SWHR3-C-0117 | 409 `SHOPPING_CART_EMPTY`: form replaced by "Your shopping cart is empty", the spec-of-record message, "Continue shopping" and "Back to shopping cart", no navigation                                                                                               |
| n/a          | payment field error beside the card number; other errors show a generic alert, log to the console and keep the form; resubmitting clears the summary; empty cart on load shows the same empty state (updated `[SWHR3-C-0091]`)                                      |

`src/components/checkout/checkout-errors.test.tsx`: field labels ("Billing · City", "Shipping · Telephone", "Payment · Card number", …), plural and singular heading, invalid-but-present fields listed after missing ones, focusable summary, `EmptyCartState` content and links. `src/utils/api.test.ts`: `ApiError` carries `missingFields`.

## Red run

`bun run test` over those three files with the components as `VortexNotImplemented` stubs and `ApiError` not yet carrying `missingFields`: 21 failed, 14 passed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 109 files, 704 tests passed. `bun run build` exit 0. No browser run (no Chromium in this container).

TDD-RESULT: 704 passed, 0 failed
