---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0093
---

# TDD result — SWHR3-T-0093

## Test cases

| Case         | Test (lib/errors.test.ts)                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0128 | `MissingFormDataError` keeps the list in order; `toHttpError` gives 422 with `data.code`, `data.fieldErrors` and `data.missingFields`             |
| n/a          | a plain `ValidationError` body is unchanged (no `missingFields`); `ShoppingCartEmptyError` is 409 `SHOPPING_CART_EMPTY`, "Shopping cart is empty" |

## Red run

`bun run test lib/errors.test.ts` with the two classes absent (constructing an undefined class fails at runtime): 2 failed, 19 passed. The unchanged-`ValidationError` test passes in red by design. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 93 files, 570 tests passed.

TDD-RESULT: 570 passed, 0 failed
