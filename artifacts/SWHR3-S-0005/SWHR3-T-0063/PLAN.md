---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0063
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0063/tdd-test-result.md]
---

# Plan — SWHR3-T-0063: Cart Calculations — cart subtotal

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 6. Requirement(s): "Calculate cart subtotal". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0062.

## Objective

`getSubTotalCents(sessionToken, locale?, outer?)` returns the cart subtotal in integer cents.

## Steps

1. Add `getSubTotalCents` to `lib/cart.ts` per C2: the sum of `cartItemTotalCostCents` (C3) over `getItems`, and `0` for an empty or unknown cart (D6).
2. Extend `lib/cart.test.ts`: 2 × 1999 plus 1 × 550 gives 4548; an empty cart gives 0; an item skipped by enrichment contributes nothing.

## File/module ownership

- `lib/cart.ts` (getSubTotalCents only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 6 checkboxes tagged with this key are stamped when it merges.
