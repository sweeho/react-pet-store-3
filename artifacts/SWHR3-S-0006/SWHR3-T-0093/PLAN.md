---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0093
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0093/tdd-test-result.md]
---

# Plan — SWHR3-T-0093: Form Validation Exceptions — MissingFormDataError and ShoppingCartEmptyError

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 11. Requirement(s): "Address field validation and error handling". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0091.

## Objective

The two checkout errors exist in `lib/errors.ts` per C5 and map to HTTP per D9.

## Steps

1. Add `MissingFormDataError(fieldErrors, missingFields)` to `lib/errors.ts`, extending `ValidationError`. Make `toHttpError` include `missingFields` in `data` beside `fieldErrors`; change nothing else in the body shape.
2. Add `ShoppingCartEmptyError`: status 409, code `SHOPPING_CART_EMPTY`, message "Shopping cart is empty".
3. Extend `lib/errors.test.ts`: `missingFields` keeps the given order; `toHttpError` gives 422 with `data.fieldErrors` and `data.missingFields`; the empty-cart error gives 409 with its code and message.

## File/module ownership

- `lib/errors.ts, lib/errors.test.ts` (the two errors only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 11 checkboxes tagged with this key are stamped when it merges.
