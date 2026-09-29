---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0132
---

# Summary — SWHR3-T-0132

`lib/supplier-orders.ts` (C4): `getSupplierOrder(poId, tx?)` returns the PO (`poId`, `poDate` = `created_at`, `poStatus`, `orderId`, `supplierId`, `expectedDeliveryDate`, `trackingNumber`) with its `contact`, `address` and `lines` (the `line_items` linked by `supplier_po_id`, exposing all seven attributes, `unitPriceCents` being the spec's unitPrice); `NotFoundError` for an unknown PO. `listSupplierOrders(status?)` lists POs oldest first, optionally by status. `deleteSupplierOrder(tx, poId)` deletes the PO; its contact and address go by cascade.

Files: `lib/supplier-orders.ts`, `lib/supplier-orders.test.ts`.

Decisions to flag (minor, not in C4): (1) `contact` and `address` are `null` for a PO that has none yet, rather than throwing, because POs created before the copy step (a later ticket) have neither; (2) `deleteSupplierOrder` first sets the PO's `line_items.supplier_po_id` to null, because that foreign key has no cascade and the lines belong to the order, not the PO. A PO that already has an invoice or fulfilment attempt still cannot be deleted (those tables have no cascade either); this helper is for cascade tests only.

Design: none applies (no UI; PLAN.md says so). The sign-in mockup named in the prompt belongs to a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0205]`; `[SWHR3-C-0204]` covers the cascade.

Verification: `bun run verify` exit 0 (897 tests), `bun run build` exit 0.
