---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0061
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0061/tdd-test-result.md]
---

# Plan — SWHR3-T-0061: Quantity Update Operations — updateItemQuantity with removal at zero or below

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 4. Requirement(s): "Update item quantities in shopping cart". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0060.

## Objective

`updateItemQuantity(sessionToken, itemId, quantity, outer?)` stores a positive quantity and removes the item at zero or below.

## Steps

1. Add `updateItemQuantity` to `lib/cart.ts` per C2 and D5: `quantity <= 0` deletes; otherwise it upserts, which also adds an absent item (SD14). It runs inside `withTransaction` (D2).
2. Extend `lib/cart.test.ts` table-driven: 3 stores 3; 0 removes; -2 removes; a positive quantity for an absent item adds it.

## File/module ownership

- `lib/cart.ts` (updateItemQuantity only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 4 checkboxes tagged with this key are stamped when it merges.
