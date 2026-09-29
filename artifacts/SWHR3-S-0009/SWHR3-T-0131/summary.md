# Summary — SWHR3-T-0131

Added `lib/supplier-order-addresses.ts` (C3, D4): `SupplierAddress`, `insertSupplierAddress(tx, poId, address)` (the `supplier_po_addresses` foreign key to the PO's contact means the contact must exist first) and `getSupplierAddress(poId, tx?)` (`NotFoundError` when absent). It mirrors `lib/supplier-order-contacts.ts`.

Tests: `lib/supplier-order-addresses.test.ts` covers SWHR3-C-0203 (AC-1): six-field round-trip with null line 2, kept line 2, refusal without a contact. No UI change.

Deviation: the case text mentions `createSupplierPOs`; the SHIP_TO copy at PO creation is the allocation ticket's code, so it is not exercised here.

Verification: red run 4 failed against stubs; `bun run verify` exit 0, 887 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
