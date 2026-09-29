---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0118
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0118/tdd-test-result.md]
---

# Plan — SWHR3-T-0118: Process Manager — allocation on approval, waiting-order retry, shipment completes the order

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 10. Requirement(s): "Order fulfillment tracking". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

An approved order is allocated (reserve + supplier POs → ALLOCATED) or waits at CONFIRMED. Shipping every PO with tracking numbers moves the order to SHIPPED and COMPLETED (D5, D7, D8, C9).

## Steps

1. Create `lib/process-manager.ts` per C9. `allocateOrder(tx, id)` returns SKIPPED unless the status is APPROVED and the stage is CONFIRMED. Otherwise it calls `reserveInventory`; on true it calls `createSupplierPOs` and `setWorkflowStage(…'ALLOCATED')` and returns ALLOCATED, and on false it returns WAITING with no writes. `retryWaitingAllocations()` runs each candidate in its own immediate transaction and returns the number allocated. `recordShipment(poId, tracking)` runs in one immediate transaction: `markPoShipped`, then, once all the order's POs are shipped, stage SHIPPED and `completeOrder`.
2. In `lib/order-status.ts`, add APPROVED→COMPLETED as a system transition that is not in `ASSIGNABLE_STATUSES`; admin rules are unchanged. In `lib/orders.ts`, add `completeOrder(tx, orderId)` using that rule.
3. In `lib/order-approval.ts` `updateOrders`, call `allocateOrder(tx, id)` for each order moved to APPROVED, inside the existing transaction (D8). Denied orders are untouched, and a WAITING result never fails the batch.
4. Create the operator scripts `db/ship-supplier-po.ts` and `db/allocate-waiting.ts`, mirroring `db/seed-orders.ts`, each printing JSON on its last line.
5. Tests (`lib/process-manager.test.ts`, extended `lib/order-approval.test.ts`, `lib/order-status.test.ts`):
   - An approved, stocked order becomes ALLOCATED with a PO.
   - An unstocked one stays CONFIRMED and is allocated by `retryWaitingAllocations` after stock is seeded.
   - Shipping its only PO with `TRK-123` gives stage SHIPPED, status COMPLETED and the tracking number stored.
   - With two POs, one shipped leaves the order ALLOCATED and APPROVED.
   - The admin status rules are unchanged, and APPROVED→COMPLETED is refused as an admin assignment.

## File/module ownership

- `lib/process-manager.ts, lib/process-manager.test.ts`
- `lib/order-status.ts, lib/order-status.test.ts`
- `lib/orders.ts, lib/orders.test.ts` (completeOrder only)
- `lib/order-approval.ts, lib/order-approval.test.ts` (allocation hook only)
- `db/ship-supplier-po.ts, db/allocate-waiting.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 10 checkboxes tagged with this key are stamped when it merges.
