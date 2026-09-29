---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0092
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0092/tdd-test-result.md]
---

# Plan — SWHR3-T-0092: Credit Card Value Object — CreditCard, checkout card types, expiry formatting and masking

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 10. Requirement(s): "Credit card value object creation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency; first in the chain.

## Objective

The checkout `CreditCard` value object and its helpers exist per C3. Every later payment ticket codes against them.

## Steps

1. Create `lib/credit-card.ts` per C3 and D6: `CHECKOUT_CARD_TYPES`, `CheckoutCardType`, `CreditCard`, `formatExpiry`, `createCreditCard` and `maskCardNumber`.
2. `createCreditCard` stores the card number with spaces removed and builds `expiryDate` with `formatExpiry`. It does not validate; validation is the parser's job (C6).
3. Test in `lib/credit-card.test.ts`: all three fields are carried; `formatExpiry(3, 2025) === "03/2025"`; `CHECKOUT_CARD_TYPES` is exactly the three names in order; `maskCardNumber("4111 1111 1111 4412") === "4412"`.

## File/module ownership

- `lib/credit-card.ts, lib/credit-card.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 10 checkboxes tagged with this key are stamped when it merges.
