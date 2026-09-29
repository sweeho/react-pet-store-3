---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0093
---

# Summary — SWHR3-T-0093

Added `MissingFormDataError(fieldErrors, missingFields)` (extends `ValidationError`, 422) and `ShoppingCartEmptyError` (409 `SHOPPING_CART_EMPTY`, "Shopping cart is empty") to `lib/errors.ts` per C5. `toHttpError` now includes `missingFields` in `data` for the first, via a small `errorData` helper; the body for every other error is unchanged.

Files: `lib/errors.ts`, `lib/errors.test.ts`.

Design: none applies (no UI; PLAN.md says so). The mockups in the prompt belong to later tickets.

AC coverage: AC-1 by `[SWHR3-C-0128]`.

Verification: `bun run verify` exit 0, 570 tests passed.
