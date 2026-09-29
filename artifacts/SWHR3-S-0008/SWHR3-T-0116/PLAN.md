---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0116
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0116/tdd-test-result.md]
---

# Plan — SWHR3-T-0116: Supplier PO Generation — supplier grouping, POs with delivery dates, shipment marking

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 8. Requirement(s): "Supplier PO generation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0120.

## Objective

An order's lines become supplier POs grouped by supplier, each with an expected delivery date. A PO can be marked shipped with a tracking number (D6, C7).

## Steps

1. Create `lib/suppliers.ts`: `DEFAULT_SUPPLIER_ID`, `SUPPLIER_LEAD_DAYS = 7` and `supplierForItem(itemId)`, which returns the default supplier (PRD: one supplier).
2. Create `lib/supplier-pos.ts`. `createSupplierPOs(tx, orderId, lines, now)` groups lines by `supplierForItem`, inserts one PO per group (status `OPEN`, `expectedDeliveryDate` = now + lead days) and sets each line's `supplierPoId`; it returns the PO ids. `markPoShipped(tx, poId, trackingNumber)` sets SHIPPED, the tracking number and `shippedAt`; an unknown PO throws `NotFoundError`, and an already-shipped PO throws `InvalidTransitionError`.
3. Test in `lib/supplier-pos.test.ts`: with the default supplier, three lines give one PO whose delivery date is exactly 7 days after a fixed `now`, and every line references it. With `supplierForItem` stubbed to two suppliers, two POs are created. `markPoShipped` stores the tracking number.

## File/module ownership

- `lib/suppliers.ts, lib/suppliers.test.ts`
- `lib/supplier-pos.ts, lib/supplier-pos.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 8 checkboxes tagged with this key are stamped when it merges.
