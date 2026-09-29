---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0083
---

# TDD result — SWHR3-T-0083

## Test cases

`src/pages/checkout.test.tsx` (mocks `cart-api`, `orders-api` and `apiFetch` for the profile):

| Case         | Test                                                                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0143 | sections in order (Billing address, Shipping address, Payment, Order summary), payment fields, summary lines and total, Edit cart, Place order, Back to shopping cart                                                       |
| SWHR3-C-0099 | billing section: every labelled field, "Optional" on Address line 2, names `given_name_a` … `email_a`                                                                                                                       |
| SWHR3-C-0105 | shipping starts blank, named `_b`, editable while billing keeps its pre-filled value                                                                                                                                        |
| SWHR3-C-0107 | "Same as billing address" disables shipping and `placeOrder` gets every `_b` equal to its `_a`                                                                                                                              |
| n/a          | billing pre-filled from the profile with the "Pre-filled from your account" hint; `noValidate`; every C4 name sent and navigation to `/orders/:id`; generic alert on failure; empty-cart, loading and load-failure branches |

`src/components/checkout/address-fields.test.tsx`: named section and step number, names per suffix, mockup field order, required/optional attributes, controlled values and `onChange`, disabled, field error, before/after slots.

## Red run

`bun run test src/pages/checkout.test.tsx src/components/checkout` with `AddressFields` as a `VortexNotImplemented` stub and the old placeholder page: 17 failed, 6 passed (the empty-cart, loading and load-failure guard tests and existing payment-fields tests). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 108 files, 683 tests passed. `bun run build` exit 0. No browser run (no Chromium in this container).

TDD-RESULT: 683 passed, 0 failed
