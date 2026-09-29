---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0066
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0066/tdd-test-result.md]
---

# Plan — SWHR3-T-0066: Cart Clearing — empty the cart in one operation

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 9. Requirement(s): "Empty shopping cart operation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0065.

## Objective

`empty(sessionToken, outer?)` removes every item in the cart with one statement.

## Steps

1. Add `empty` to `lib/cart.ts` per C2: a single delete scoped to the token inside `withTransaction` (D2).
2. Extend `lib/cart.test.ts`: a three-item cart reads `{}` and counts 0 after `empty`; another token's cart is untouched; emptying an empty cart throws nothing.

## File/module ownership

- `lib/cart.ts` (empty only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 9 checkboxes tagged with this key are stamped when it merges.
