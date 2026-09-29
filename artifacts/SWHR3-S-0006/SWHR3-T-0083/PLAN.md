---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0083
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0083/tdd-test-result.md]
---

# Plan — SWHR3-T-0083: Address Collection Forms — the /checkout form with billing, shipping and payment sections

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 1. Requirement(s): "Billing address collection", "Shipping address collection", "Checkout form display". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0094.

## Objective

`/checkout` renders the three-section order form for a non-empty cart and submits it to `POST /api/orders`. On success it navigates to `/orders/:id`.

## Steps

1. Create `src/components/checkout/address-fields.tsx` (+ test): one numbered address section built from `CONTACT_INFO_FIELDS` (C10 mirror) with `FormField` and `Input`. It takes a `suffix` (`_a`/`_b`) so the inputs are named per C4, and accepts `defaultValues`, `disabled` and `errors` props. "Address line 2" is marked Optional.
2. Rewrite `src/pages/checkout.tsx`, keeping its empty-cart and load-failure branches unchanged; SWHR3-T-0097 restyles them. It loads the cart and `GET /api/customers/me` in parallel. A 404 profile means no pre-fill (D10). Billing is pre-filled from the profile. Shipping starts blank, with a "Same as billing address" checkbox that copies billing and disables the shipping inputs (SD8). Section 3 is `PaymentFields`, never pre-filled.
3. The `<form>` sets `noValidate` (D13); inputs keep `required` / `aria-required`. Add the order summary aside (lines, total, "Edit cart" to `/cart`), "Place order" and "Back to shopping cart". Submitting serialises `FormData` (with shipping copied from billing when the checkbox is on), calls `placeOrder` and navigates to `ORDER_CONFIRMATION_PATH(orderId)`. For now any error shows a generic alert; SWHR3-T-0097 adds the field-level display.
4. Tests mock `src/utils/orders-api.ts`, `src/utils/cart-api.ts` and the profile fetch. They cover: all three sections with every labelled field; billing pre-filled; shipping blank and independently editable; the checkbox copying billing; the submit sending every C4 field name; and navigation on success.

## File/module ownership

- `src/pages/checkout.tsx, src/pages/checkout.test.tsx`
- `src/components/checkout/address-fields.tsx, src/components/checkout/address-fields.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build what these show, main content only (SD12). The mockups are the target; the wireframes show structure:

- `artifacts/SWHR3-S-0006/design/mockup-checkout-enter-order-information.html` and `artifacts/SWHR3-S-0006/design/wireframe-checkout-enter-order-information.html`: three numbered sections (1 Billing address "Pre-filled from your account", 2 Shipping address "Where the pets are delivered", 3 Payment), the field labels, "Optional" on Address line 2, the email note, the order summary with "Edit cart", "Place order" and "Back to shopping cart".

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 1 checkboxes tagged with this key are stamped when it merges.
