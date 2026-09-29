---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0142
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0142/tdd-test-result.md]
---

# Plan — SWHR3-T-0142: Transaction Management — PO creation and inventory-update-plus-reprocess atomicity suite

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 15. Requirement(s): "Container-managed transactions". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0136, SWHR3-T-0138.

## Objective

It is proven that PO creation (PO, contact, address, reservation) and an inventory update with its reprocessing are each all-or-nothing (D3, D6).

## Steps

1. Create `lib/supplier-workflow.atomicity.test.ts`:
   - A failure injected in `insertSupplierAddress` during an approval leaves no PO, contact, reservation or stage change, and the approval rolls back.
   - A failure injected in `processPendingSupplierOrders` during `applyInventoryUpdate` leaves every inventory quantity unchanged.
   - `applyInventoryUpdate` given an outer transaction joins it, with `db.transaction` called once.
2. Change no production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/supplier-workflow.atomicity.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 15 checkboxes tagged with this key are stamped when it merges.
