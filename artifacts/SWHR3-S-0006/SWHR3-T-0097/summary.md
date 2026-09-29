---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0097
---

# Summary — SWHR3-T-0097

- `src/components/checkout/checkout-errors.tsx`: `CheckoutErrors` (destructive alert "Your order was not placed — N required fields are missing", the "Fill in the fields listed below…" line, one "Billing · City" / "Shipping · Telephone" / "Payment · Card number" entry per field, `tabIndex -1` so it takes focus) and `EmptyCartState` (heading "Your shopping cart is empty", the mockup's body copy, the `EMPTY_CART_CHECKOUT_MESSAGE` alert, "Continue shopping" to `/`, "Back to shopping cart" to `/cart`, the "still on your account" note).
- `src/pages/checkout.tsx`: a 422 shows the summary, passes `fieldErrors` into both address sections and the payment section, keeps every entered value and focuses the summary; a 409 `SHOPPING_CART_EMPTY`, or an empty cart on load, shows `EmptyCartState`; any other error logs to the console and shows the generic alert.
- `src/utils/api.ts` (outside this ticket's ownership list, see below): `ApiError` now carries `missingFields`, read from the response's `data.missingFields`.

Ownership deviation: the plan has the page read `missingFields` from a 422 `ApiError`, but `ApiError` dropped that field, so the list could not reach the page. I made the smallest additive change in `src/utils/api.ts` (one optional field, no behaviour change for other callers) with a test in `src/utils/api.test.ts`, rather than stopping the ticket. Planning may want to record it.

Design: built from `mockup-checkout-missing-required-fields.html` and `mockup-checkout-blocked-shopping-cart-is-empty.html` (main content only, SD12). Not reproduced: the banner and empty-cart icons and the category chips (they would be dead links until the catalogue exists). Not viewed in a browser. `[SWHR3-C-0091]` was updated because the empty state now has two links.

AC coverage: AC-1 by `[SWHR3-C-0102]`; `[SWHR3-C-0117]` covers the empty-cart refusal.

Verification: `bun run verify` exit 0 (704 tests), `bun run build` exit 0. E2E not run (no Chromium).
