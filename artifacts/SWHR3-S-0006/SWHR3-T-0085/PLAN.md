---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0085
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0085/tdd-test-result.md]
---

# Plan — SWHR3-T-0085: Credit Card Collection — extractCreditCard and the payment section fields

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 3. Requirement(s): "Credit card collection for payment". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0084.

## Objective

The request's card fields become a `CreditCard`, and the payment section of the form exists as a component.

## Steps

1. Add `extractCreditCard(fields, errors)` to `lib/checkout-request.ts` per C6 and D6. The card number is required and must be 12–19 digits once spaces are removed. The type must be one of `CHECKOUT_CARD_TYPES`. The month must be `01`–`12`, and the year a four-digit year from the current year to five ahead. It builds the card with `createCreditCard`, so the expiry is `MM/YYYY`.
2. Create `src/components/checkout/payment-fields.tsx` (+ test): the "3 Payment" section. It has a Card type select with exactly Java Card, Duke Express and Meow Card, a Card number input, an Expiry month select `01`–`12` and an Expiry year select (current year + 5). Its inputs are named per C4. Build it from `Select`, `Input` and `FormField`, with an optional `errors` prop for inline messages. Read the card types from the client mirror declared in this file until SWHR3-T-0095 adds `src/types/checkout.ts`; that ticket moves them.
3. Tests: the parser handles valid, missing, bad-type, month `13` and past-year cases, and `"3"`/`2025` stores `"03/2025"`. The component offers exactly three card-type options, twelve months and six years.

## File/module ownership

- `lib/checkout-request.ts, lib/checkout-request.test.ts`
- `src/components/checkout/payment-fields.tsx, src/components/checkout/payment-fields.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build what these show, main content only (SD12). The mockups are the target; the wireframes show structure:

- `artifacts/SWHR3-S-0006/design/mockup-checkout-enter-order-information.html` and `artifacts/SWHR3-S-0006/design/wireframe-checkout-enter-order-information.html`: three numbered sections (1 Billing address "Pre-filled from your account", 2 Shipping address "Where the pets are delivered", 3 Payment), the field labels, "Optional" on Address line 2, the email note, the order summary with "Edit cart", "Place order" and "Back to shopping cart".

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 3 checkboxes tagged with this key are stamped when it merges.
