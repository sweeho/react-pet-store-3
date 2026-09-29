---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0136
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0136/tdd-test-result.md]
---

# Plan — SWHR3-T-0136: Inventory Update Handler — applyInventoryUpdate with reprocessing in one transaction

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 9. Requirement(s): "Inventory update form", "Inventory quantity update validation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0141.

## Objective

`applyInventoryUpdate` sets each quantity and reprocesses every PENDING supplier PO in one immediate transaction (D6, C7).

## Steps

1. Create `lib/inventory-update.ts` per C7. Inside `withTransaction(fn, outer, { behavior: 'immediate' })` it calls `updateQuantity` for each update, then `processPendingSupplierOrders(tx)`. It returns the updated item ids and the processing counts.
2. Test in `lib/inventory-update.test.ts`: updating EST-1 to 0 and EST-2 to 7 persists both, including zero. With an approved order waiting on EST-2 (a PENDING PO), the same call moves that PO to PROCESSING and returns `fulfilledOrders` 1. An empty update list changes nothing but still reprocesses.

## File/module ownership

- `lib/inventory-update.ts, lib/inventory-update.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 9 checkboxes tagged with this key are stamped when it merges.
