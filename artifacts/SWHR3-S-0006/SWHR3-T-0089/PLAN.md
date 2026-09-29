---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0089
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0089/tdd-test-result.md]
---

# Plan — SWHR3-T-0089: Shopping Cart Validation — getCheckoutLines refuses an empty cart

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 7. Requirement(s): "Shopping cart validation before order placement". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0093.

## Objective

`getCheckoutLines` returns the cart's enriched lines inside the caller's transaction, or throws `ShoppingCartEmptyError`.

## Steps

1. Create `lib/checkout-cart.ts` per C7. It calls `getItems(cartToken, locale, tx)` from `lib/cart.ts` and throws `ShoppingCartEmptyError` (C5) when the result is empty: an undefined token, no rows, or only catalogue-missing rows.
2. Test in `lib/checkout-cart.test.ts` against the in-memory db: two lines are returned in insertion order; each empty case throws the error with message "Shopping cart is empty".

## File/module ownership

- `lib/checkout-cart.ts, lib/checkout-cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 7 checkboxes tagged with this key are stamped when it merges.
