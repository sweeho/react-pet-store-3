---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0138
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0138/tdd-test-result.md]
---

# Plan — SWHR3-T-0138: Invoice Generation — invoice at PO completion, delivered in-process to complete the order

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 11. Requirement(s): "Invoice generation", "Invoice messaging integration". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0137.

## Objective

Completing a PO (shipment) generates its invoice and delivers it to the order side, which records shipped quantities and completes the order when every PO is done (D9, C9).

## Steps

1. Create `lib/invoices.ts` per C9. `generateInvoice(tx, poId)` builds the invoice from `getSupplierOrder`: lines of item, quantity, unit price in cents and line total; the total; the invoice date (now); and a snapshot of the delivery contact. It inserts it with status `SENT`. `receiveInvoice(tx, invoiceId)` sets `line_items.quantity_shipped = quantity` for the PO's lines, and when every PO of the order is COMPLETED it sets the stage to SHIPPED and calls `completeOrder`.
2. Change `lib/process-manager.ts` `recordShipment`: in one immediate transaction it calls `markPoShipped` (PROCESSING→COMPLETED with tracking), then `generateInvoice`, then `receiveInvoice`. It returns `{ orderCompleted, invoiceId }`.
3. Tests (`lib/invoices.test.ts`, updated `lib/process-manager.test.ts`):
   - Shipping a single-PO order gives one invoice whose total equals the PO lines' sum; `quantity_shipped` equals `quantity`; the stage is SHIPPED and the status COMPLETED.
   - With two POs, the first shipment invoices and records only its lines, and the order stays APPROVED.
   - Shipping a PENDING PO throws and writes no invoice.

## File/module ownership

- `lib/invoices.ts, lib/invoices.test.ts`
- `lib/process-manager.ts, lib/process-manager.test.ts` (recordShipment only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 11 checkboxes tagged with this key are stamped when it merges.
