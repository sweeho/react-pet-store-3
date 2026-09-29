---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0060
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0060/tdd-test-result.md]
---

# Plan — SWHR3-T-0060: Item Removal Operations — deleteItem by identifier

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 3. Requirement(s): "Remove items from shopping cart". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0059.

## Objective

`deleteItem(sessionToken, itemId, outer?)` removes one item transactionally and leaves the rest of the cart untouched.

## Steps

1. Add `deleteItem` to `lib/cart.ts` per C2: one delete scoped to token and itemId inside `withTransaction` (D2). It is a no-op when the item is absent.
2. Extend `lib/cart.test.ts`: removing one of two items leaves the other; removing an absent item throws nothing; another token's identical item is untouched.

## File/module ownership

- `lib/cart.ts` (deleteItem only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 3 checkboxes tagged with this key are stamped when it merges.
