---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0133
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0133/tdd-test-result.md]
---

# Plan — SWHR3-T-0133: Inventory Management — getInventory, getInventoryItem and updateQuantity

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 6. Requirement(s): "Inventory entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency.

## Objective

Inventory can be listed for every catalogue item, read per item, and set with before/after values returned (D8, C5).

## Steps

1. Add `InventoryRow`, `getInventory`, `getInventoryItem` and `updateQuantity` to `lib/inventory.ts` per C5 and D8. The list left-joins `catalog_items`, a missing row reads 0, and it is ordered by item id. `updateQuantity` upserts and returns `{ before, after }`. `reserveInventory` and `setInventory` are unchanged.
2. Extend `lib/inventory.test.ts`: a catalogue item without an inventory row lists with 0; `updateQuantity` from 0 to 12 returns `{ before: 0, after: 12 }` and persists; `getInventoryItem` of an unknown item throws `NotFoundError`.

## File/module ownership

- `lib/inventory.ts, lib/inventory.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 6 checkboxes tagged with this key are stamped when it merges.
