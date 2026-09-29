---
artifact: tdd-test-result
ticket: SWHR3-T-0138
---

# TDD result — SWHR3-T-0138

## Test cases

`lib/invoices.test.ts` (in-memory db, APPROVED orders with a SHIP_TO snapshot, allocated through `allocateOrder`):

- SWHR3-C-0215: shipping a fulfilled PO (2 × 1999 and 1 × 550, date faked) gives an invoice with the order id, invoice date, two lines (line totals 3998 and 550), total 4548, status SENT and the delivery contact.
- SWHR3-C-0216: a PENDING PO cannot be shipped or invoiced (`InvalidTransitionError`) and no invoice row is written.
- SWHR3-C-0219: `receiveInvoice` sets `quantity_shipped = quantity` on the PO's lines, moves the order to SHIPPED / COMPLETED and returns `orderCompleted: true`.
- SWHR3-C-0220: with two POs (supplier lookup stubbed), the first shipment sets only its own lines, leaves the order APPROVED at ALLOCATED and returns false; the second completes it.

`lib/process-manager.test.ts`: SWHR3-C-0199 (a PO reads PENDING, then PROCESSING after `processPendingSupplierOrders`, then COMPLETED after `recordShipment`); the C-0179 and C-0180 expectations now include `invoiceId`.

The migration half of C-0199 (OPEN reads PROCESSING, SHIPPED reads COMPLETED) is covered by the existing `lib/supplier-order-status.migration.test.ts`.

## Red run

`bun --bun vitest run lib/invoices.test.ts lib/process-manager.test.ts` against `lib/invoices.ts` stubs throwing `VortexNotImplemented` and the old `recordShipment`: 6 failed | 8 passed (14). C-0199 passed on the old code because the status flow already existed.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 133 files, 917 tests passed.

TDD-RESULT: 917 passed, 0 failed
