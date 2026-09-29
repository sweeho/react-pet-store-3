---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0071
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0071/tdd-test-result.md]
---

# Plan — SWHR3-T-0071: Catalog Integration — lib/catalog.ts getItem(itemId, locale) and catalogue seed

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 14. Requirement(s): "Locale-specific product information", "Retrieve cart items with catalog enrichment". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0067.

## Objective

`getItem(itemId, locale)` reads a catalogue item with locale-specific name and attribute, and an operator/E2E script seeds sample items.

## Steps

1. Add `CatalogItemNotFoundError` to `lib/errors.ts` per C4 and extend `lib/errors.test.ts` for its `toHttpError` mapping.
2. Create `lib/catalog.ts` per C4 and D3: the `CatalogItem` interface (move it here if SWHR3-T-0067 declared it in `lib/cart-item.ts`, and re-point that import), and `getItem(itemId, locale, outer?)`. Details come for `locale`, falling back to `en_US`; with neither, or with no item row, it throws `CatalogItemNotFoundError`.
3. Create `db/seed-catalog.ts`, mirroring `db/seed-orders.ts`. It idempotently upserts a handful of items (e.g. `EST-1`…`EST-4`, varied prices) with `en_US` and `ja_JP` details, and prints `{"itemIds":[...]}` on its last stdout line.
4. Test in `lib/catalog.test.ts`: `ja_JP` returns the Japanese name, `en_US` the English one, an unknown locale falls back to English, and an unknown item throws `CatalogItemNotFoundError`.

## File/module ownership

- `lib/catalog.ts, lib/catalog.test.ts`
- `lib/errors.ts, lib/errors.test.ts` (the new error only)
- `lib/cart-item.ts` (CatalogItem import only, if needed)
- `db/seed-catalog.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 14 checkboxes tagged with this key are stamped when it merges.
