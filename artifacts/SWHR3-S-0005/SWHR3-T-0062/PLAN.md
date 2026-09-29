---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0062
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0062/tdd-test-result.md]
---

# Plan — SWHR3-T-0062: Cart Retrieval and Enrichment — getItems enriched from the catalogue

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 5. Requirement(s): "Retrieve cart items with catalog enrichment". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0061.

## Objective

`getItems(sessionToken, locale?, outer?)` turns cart rows into `CartItem`s using `lib/catalog.ts`, skipping any item the catalogue cannot supply.

## Steps

1. Add `getItems` to `lib/cart.ts` per C2. Read rows in insertion order, call `getItem(itemId, locale, tx)` from `lib/catalog.ts` (C4) for each, and build with `createCartItem` from `lib/cart-item.ts` (C3).
2. Catch `CatalogItemNotFoundError` per item, `console.warn` the itemId, and continue (D4, SD5). Any other error propagates.
3. Extend `lib/cart.test.ts` with catalogue fixture rows: enriched fields match the catalogue; a cart row with no catalogue item is skipped, the others are returned, and the warning is logged (spy on `console.warn`).

## File/module ownership

- `lib/cart.ts` (getItems only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 5 checkboxes tagged with this key are stamped when it merges.
