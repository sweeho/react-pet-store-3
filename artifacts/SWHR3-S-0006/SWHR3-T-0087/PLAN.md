---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0087
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0087/tdd-test-result.md]
---

# Plan — SWHR3-T-0087: EJB Order Processing — placeOrder in one immediate transaction

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 5. Requirement(s): "Transactional order creation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0086.

## Objective

`placeOrder` performs D4: read the cart, write the order and its snapshots and lines, and empty the cart, all in one transaction.

## Steps

1. Create `lib/checkout.ts` with `placeOrder({ accountId, cartToken, locale, event }, outer?)` per C8. Inside `withTransaction(fn, outer, { behavior: "immediate" })` it calls `getCheckoutLines` (C7), then `toPurchaseOrder` and `insertPurchaseOrder`, then `empty(cartToken, tx)`. It returns `{ orderId, orderDate (ISO), email }`.
2. Test in `lib/checkout.test.ts`: a success writes one order, two contacts and N line items, and empties the cart. Given an outer transaction it joins it instead of starting one. If `insertPurchaseOrder` fails after the order row (force it, e.g. with a duplicate line number or a spy), no `orders`, `order_contacts` or `line_items` row remains and the cart is unchanged.

## File/module ownership

- `lib/checkout.ts, lib/checkout.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 5 checkboxes tagged with this key are stamped when it merges.
