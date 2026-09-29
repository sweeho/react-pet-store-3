---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0064
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0064/tdd-test-result.md]
---

# Plan — SWHR3-T-0064: Item and Cart Counts — distinct-item count and cart details copy

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 7. Requirement(s): "Count distinct items in cart". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0063.

## Objective

`getCount(sessionToken, outer?)` returns the number of distinct items, and `getDetails` is proven to return a copy.

## Steps

1. Add `getCount` to `lib/cart.ts` per C2: a count of rows for the token, not a sum of quantities.
2. Extend `lib/cart.test.ts`: three items with quantities 1, 4 and 7 count 3; an empty cart counts 0; one item counts 1; mutating the object `getDetails` returns does not change the next read.

## File/module ownership

- `lib/cart.ts` (getCount only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 7 checkboxes tagged with this key are stamped when it merges.
