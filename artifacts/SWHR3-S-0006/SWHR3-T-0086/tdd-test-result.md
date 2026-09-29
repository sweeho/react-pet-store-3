---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0086
---

# TDD result — SWHR3-T-0086

## Test cases

| Case                 | Test (lib/checkout-request.test.ts)                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0132         | event holds shipper "Sarah", receiver "Alex", card type "Meow Card"                                                          |
| SWHR3-C-0127         | blank `city_a`, `telephone_number_b`, `credit_card_number` give one error, `missingFields` in that order, a message for each |
| SWHR3-C-0135         | `_a`-only body reports the nine required `_b` fields and no `_a` field                                                       |
| SWHR3-C-0133, C-0134 | already present from T-0083 (`extractContactInfo` suffix isolation); unchanged and still passing                             |
| n/a                  | invalid value appears in `fieldErrors` but not `missingFields`; non-object bodies throw with an empty list                   |

## Red run

`bun run test lib/checkout-request.test.ts` against a `VortexNotImplemented` stub of `parseCheckoutRequest`: 8 failed, 30 passed (the existing extractor tests). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 97 files, 620 tests passed.

TDD-RESULT: 620 passed, 0 failed
