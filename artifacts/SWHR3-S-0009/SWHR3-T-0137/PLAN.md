---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0137
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0137/tdd-test-result.md]
---

# Plan — SWHR3-T-0137: Pending Order Reprocessing — fulfilSupplierOrder, processPendingSupplierOrders, PENDING POs at approval

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 10. Requirement(s): "Inventory validation for order fulfillment", "Pending order reprocessing". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0139.

## Objective

Approval always creates PENDING POs and tries to fulfil them. Fulfilling checks and deducts stock per PO, and pending POs are retried in bulk (D3, D5, C8).

## Steps

1. Create `lib/supplier-fulfilment.ts` per C8. `fulfilSupplierOrder` returns SKIPPED unless the PO is PENDING. It checks every line against inventory; if all are covered it calls `reserveInventory` and moves the PO to PROCESSING through `assertSupplierOrderTransition`. On a shortage it deducts nothing and returns UNABLE with `shortItems` (recording and logging are SWHR3-T-0143's).
   When every PO of the order is PROCESSING and the stage is CONFIRMED, it sets the stage to ALLOCATED. `processPendingSupplierOrders` runs every PENDING PO, oldest first.
2. Change `lib/process-manager.ts` `allocateOrder` per D3. It creates the POs with `createSupplierPOs` (PENDING, with contact and address, per SWHR3-T-0139), then calls `fulfilSupplierOrder` for each. It returns ALLOCATED when the stage reached ALLOCATED and WAITING otherwise. `retryWaitingAllocations()` delegates to `processPendingSupplierOrders` in one immediate transaction and returns the fulfilled count.
3. Tests (`lib/supplier-fulfilment.test.ts`, updated `lib/process-manager.test.ts`):
   - A stocked approval gives a PROCESSING PO, deducted inventory and ALLOCATED.
   - A short approval gives a PENDING PO, unchanged inventory and CONFIRMED.
   - Seeding stock then `processPendingSupplierOrders` fulfils it.
   - A two-line PO with one line short deducts neither line.
   - `order-approval` tests keep passing; update any assertion that expected no PO while waiting (SD9).

## File/module ownership

- `lib/supplier-fulfilment.ts, lib/supplier-fulfilment.test.ts`
- `lib/process-manager.ts, lib/process-manager.test.ts` (allocateOrder and retryWaitingAllocations)
- `lib/order-approval.test.ts` (waiting-order assertions only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 10 checkboxes tagged with this key are stamped when it merges.
