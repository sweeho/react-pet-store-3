---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0059
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0059/tdd-test-result.md]
---

# Plan — SWHR3-T-0059: Item Addition Operations — addItem with default and explicit quantity

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 2. Requirement(s): "Add items to shopping cart". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0071.

## Objective

`addItem(sessionToken, itemId, quantity = 1, outer?)` stores an item in the cart transactionally.

## Steps

1. Add `addItem` to `lib/cart.ts` per C2. It inserts, or on conflict of (`session_token`, `item_id`) sets, the quantity (D5, upsert), inside `withTransaction(fn, outer)` (D2).
2. Reject a quantity that is not a positive integer with `ValidationError({ quantity })` from `lib/errors.ts`.
3. Extend `lib/cart.test.ts`: `addItem(t, id)` gives `getDetails(t)[id] === 1`; `addItem(t, id, 4)` gives 4; re-adding sets rather than increments (SD10); 0, -1 and 1.5 are rejected.

## File/module ownership

- `lib/cart.ts` (addItem only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 2 checkboxes tagged with this key are stamped when it merges.
