---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0097
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0097/tdd-test-result.md]
---

# Plan — SWHR3-T-0097: Error Handling and Recovery — missing-fields summary, inline errors and empty-cart state on /checkout

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 15. Requirement(s): "Billing address collection". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0083.

## Objective

A refused order is explained on `/checkout` the way the mockups show: a summary of every missing field, inline messages, and the empty-cart state.

## Steps

1. Create `src/components/checkout/checkout-errors.tsx` (+ test): the summary alert "Your order was not placed — N required fields are missing" with "Fill in the fields listed below…" and one entry per `missingFields` item, labelled "Billing · City" / "Shipping · Telephone" / "Payment · Card number" from the C10 field table.
2. In `src/pages/checkout.tsx`, on a 422 `ApiError` render the summary above the form and pass `fieldErrors` into `AddressFields` and `PaymentFields`. Keep every entered value, and move focus to the summary.
3. On a 409 `SHOPPING_CART_EMPTY`, or when the cart loads empty, render the empty-cart state from the design reference. It has the heading "Your shopping cart is empty" and the body copy, keeps the existing `EMPTY_CART_CHECKOUT_MESSAGE` alert text (SD7), and offers "Continue shopping" (`/`) and "Back to shopping cart" (`/cart`). Any other error shows a generic alert and logs to the console.
4. Tests: a 422 with billing city missing lists "Billing · City" and shows "Enter a city." beside the field with values kept; a 409 shows the empty-cart state and no form; the existing empty-cart page test still passes.

## File/module ownership

- `src/components/checkout/checkout-errors.tsx, src/components/checkout/checkout-errors.test.tsx`
- `src/pages/checkout.tsx, src/pages/checkout.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build what these show, main content only (SD12). The mockups are the target; the wireframes show structure:

- `artifacts/SWHR3-S-0006/design/mockup-checkout-enter-order-information.html` and `artifacts/SWHR3-S-0006/design/wireframe-checkout-enter-order-information.html`: three numbered sections (1 Billing address "Pre-filled from your account", 2 Shipping address "Where the pets are delivered", 3 Payment), the field labels, "Optional" on Address line 2, the email note, the order summary with "Edit cart", "Place order" and "Back to shopping cart".
- `artifacts/SWHR3-S-0006/design/mockup-checkout-missing-required-fields.html` / `artifacts/SWHR3-S-0006/design/wireframe-checkout-missing-required-fields.html`: the summary alert "Your order was not placed — N required fields are missing" with its list ("Billing · City"…), and inline messages ("Enter a city.", "Spaces only — enter a code.").
- `artifacts/SWHR3-S-0006/design/mockup-checkout-blocked-shopping-cart-is-empty.html` / `artifacts/SWHR3-S-0006/design/wireframe-checkout-blocked-shopping-cart-is-empty.html`: the empty-cart state.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 15 checkboxes tagged with this key are stamped when it merges.
