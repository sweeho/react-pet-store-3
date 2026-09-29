# Summary — SWHR3-T-0138

- `lib/invoices.ts` (C9, D9): `generateInvoice(tx, poId)` builds a SENT invoice from `getSupplierOrder` (lines of item, quantity, unit price, line total; total; invoice date now) and refuses a PO that is not COMPLETED. `receiveInvoice(tx, invoiceId)` sets `quantity_shipped` on that PO's lines and, when every PO of the order is COMPLETED, moves the stage to SHIPPED and completes the order. `getInvoice(invoiceId, tx?)` reads it back.
- `lib/process-manager.ts`: `recordShipment` is now `markPoShipped`, `generateInvoice`, `receiveInvoice` in one immediate transaction and returns `{ orderCompleted, invoiceId }`. `allocateOrder` is untouched.
- Tests: `lib/invoices.test.ts` (SWHR3-C-0215, C-0216, C-0219, C-0220) and `lib/process-manager.test.ts` (C-0199, updated C-0179 and C-0180 expectations). Covers AC-1 and AC-2.

Decision: `supplier_invoices` has no contact column (C1), so `getInvoice` returns the delivery contact from the PO's contact, which is already an immutable copy of the order's SHIP_TO (D4), instead of a second snapshot. No UI change.

Verification: red run 6 failed against stubs and the old `recordShipment`; `bun run verify` exit 0, 917 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
