# Summary — SWHR3-T-0116

- `lib/suppliers.ts`: `DEFAULT_SUPPLIER_ID` ("PETSTORE-SUPPLIER"), `SUPPLIER_LEAD_DAYS` (7), `supplierForItem` (always the default, per the PRD's single supplier).
- `lib/supplier-pos.ts`: `createSupplierPOs(tx, orderId, lines, now)` groups lines by supplier, inserts one OPEN PO per group due `now` + 7 days, sets each line's `supplier_po_id`, returns the PO ids. `markPoShipped(tx, poId, tracking)` sets SHIPPED, the tracking number and `shippedAt`; unknown PO throws `NotFoundError`, non-OPEN PO throws `InvalidTransitionError`.
- Tests: `lib/suppliers.test.ts`, `lib/supplier-pos.test.ts` (AC-1 via C-0174).

Decisions: `lines` is `{ lineNumber, itemId }[]` (the identifying part of a `line_items` row, which the process manager already holds). `InvalidTransitionError` is built with the PO id, so its message reads "Order <poId> is SHIPPED ...", since `lib/errors.ts` is outside this ticket's ownership. No UI change.

Verification: red run 5 failed against stubs; `bun run verify` exit 0, 733 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
