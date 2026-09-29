---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0096
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0096/tdd-test-result.md]
---

# Plan — SWHR3-T-0096: Integration Testing — end-to-end checkout journeys

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 14. Requirement(s): "Shopping cart validation before order placement". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0097.

## Objective

A Playwright spec drives checkout in a real browser: success, missing fields, and a cart that empties before the order is placed.

## Steps

1. Create `e2e/checkout.spec.ts`. Seed the catalogue with `bun db/seed-catalog.ts` as `e2e/cart.spec.ts` does. Register and sign in a fresh customer with a profile through the UI or API, as `e2e/customer-auth.spec.ts` does. Fill the cart through `page.request.post('/api/cart', …)`.
2. Journeys:
   - (a) Visit `/checkout` signed out and land on `/signin?redirect=/checkout`.
   - (b) Billing is pre-filled. Fill shipping and payment, click Place order, land on `/orders/<id>` and see the number, billing email, both addresses and the masked card. `/cart` is then empty.
   - (c) Blank the billing city and click Place order: the summary lists "Billing · City" and the URL stays `/checkout`.
   - (d) With the form filled, empty the cart through `DELETE /api/cart` in the same context, then click Place order: the empty-cart state shows and no confirmation page is reached.
3. Run the spec locally at least once before committing. If Chromium is unavailable, say so in the work log.

## File/module ownership

- `e2e/checkout.spec.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build what these show, main content only (SD12). The mockups are the target; the wireframes show structure:

- `artifacts/SWHR3-S-0006/design/mockup-checkout-enter-order-information.html` and `artifacts/SWHR3-S-0006/design/wireframe-checkout-enter-order-information.html`: three numbered sections (1 Billing address "Pre-filled from your account", 2 Shipping address "Where the pets are delivered", 3 Payment), the field labels, "Optional" on Address line 2, the email note, the order summary with "Edit cart", "Place order" and "Back to shopping cart".
- `artifacts/SWHR3-S-0006/design/mockup-checkout-missing-required-fields.html` / `artifacts/SWHR3-S-0006/design/wireframe-checkout-missing-required-fields.html`: the summary alert "Your order was not placed — N required fields are missing" with its list ("Billing · City"…), and inline messages ("Enter a city.", "Spaces only — enter a code.").
- `artifacts/SWHR3-S-0006/design/mockup-checkout-blocked-shopping-cart-is-empty.html` / `artifacts/SWHR3-S-0006/design/wireframe-checkout-blocked-shopping-cart-is-empty.html`: the empty-cart state.
- Build the main content of `artifacts/SWHR3-S-0006/design/mockup-order-confirmation.html` (structure in `artifacts/SWHR3-S-0006/design/wireframe-order-confirmation.html`): the heading "Thank you — your order has been received"; the order number, order date and notification email; "What you ordered" with lines and total; "Billed to" and "Shipped to"; "<type> ending <last4> · Expires MM/YYYY"; and "Continue shopping". Storefront chrome is out of scope (SD12).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 14 checkboxes tagged with this key are stamped when it merges.
