---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0132
---

# TDD result — SWHR3-T-0132

## Test cases

`lib/supplier-orders.test.ts` (in-memory db, fixture order with a PO, contact, address and two lines):

| Case         | Test                                                                                                                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0205 | `getSupplierOrder` returns `poId`, `poDate`, `poStatus`, `orderId`, `supplierId`, `expectedDeliveryDate`, `trackingNumber`, `contact`, `address`, and two `lines` each with `itemId`, `quantity`, `quantityShipped` (0), `lineNumber`, `categoryId`, `productId`, `unitPriceCents` equal to the stored values |
| SWHR3-C-0204 | `deleteSupplierOrder` leaves no `supplier_po_contacts` or `supplier_po_addresses` row for the PO                                                                                                                                                                                                              |
| n/a          | only lines linked to that PO are returned; a PO with no contact or address reads both as `null`; unknown PO throws `NotFoundError`; `listSupplierOrders("PENDING")` / `("PROCESSING")` filter by status and no argument lists all; the PO's line items are unlinked, not deleted, by the delete               |

## Red run

`bun run test lib/supplier-orders.test.ts` against `VortexNotImplemented` stubs: 7 failed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 131 files, 897 tests passed. `bun run build` exit 0.

TDD-RESULT: 897 passed, 0 failed
