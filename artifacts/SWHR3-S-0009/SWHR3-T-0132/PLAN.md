---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0132
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0132/tdd-test-result.md]
---

# Plan — SWHR3-T-0132: EJB Relationships — supplier order read model with contact, address and line items; cascade delete

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 5. Requirement(s): "Line item entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0130, SWHR3-T-0131.

## Objective

`getSupplierOrder` returns a PO with its contact, address and line items (all seven attributes). Deleting a PO cascades to its contact and address (C4).

## Steps

1. Create `lib/supplier-orders.ts` per C4. `lines` are the `line_items` with this `supplier_po_id`, exposing `itemId`, `quantity`, `quantityShipped`, `lineNumber`, `categoryId`, `productId` and `unitPriceCents`.
2. Test in `lib/supplier-orders.test.ts`: a fixture order with PO, contact, address and two lines reads back with every field; `deleteSupplierOrder` leaves no contact or address row (cascade); `listSupplierOrders('PENDING')` filters by status.

## File/module ownership

- `lib/supplier-orders.ts, lib/supplier-orders.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 5 checkboxes tagged with this key are stamped when it merges.
