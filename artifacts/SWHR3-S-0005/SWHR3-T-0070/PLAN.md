---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0070
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0070/tdd-test-result.md]
---

# Plan — SWHR3-T-0070: EJB Tier Action Handler — applyCartAction dispatch in one transaction

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 13. Requirement(s): "Cart operation transactions". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0066.

## Objective

`applyCartAction(sessionToken, action, outer?)` dispatches every `CartAction` to `lib/cart.ts` inside one transaction.

## Steps

1. Create `lib/cart-actions.ts` per C5 and D8. Define the `CartAction` union. `applyCartAction` opens `withTransaction(fn, outer, { behavior: "immediate" })` and dispatches: `ADD_ITEM` to `addItem`, `DELETE_ITEM` to `deleteItem`, `UPDATE_ITEMS` to `updateItemQuantity` per entry, and `EMPTY` to `empty`, each passed the transaction (D2).
2. Test in `lib/cart-actions.test.ts`: each action type reaches its operation and changes `getDetails`; given an outer transaction it joins that transaction rather than starting one (spy on `db.transaction`); an `UPDATE_ITEMS` whose second entry throws leaves the cart exactly as before.

## File/module ownership

- `lib/cart-actions.ts, lib/cart-actions.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 13 checkboxes tagged with this key are stamped when it merges.
