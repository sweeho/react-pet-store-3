# SWHR3-T-0130 summary

Added `lib/supplier-order-contacts.ts` (C3): `SupplierContact`, `insertSupplierContact(tx, poId, contact)` and `getSupplierContact(poId, tx?)`, which throws `NotFoundError` when the PO has no contact. The 1:1 rule comes from the `supplier_po_id` primary key already in the schema (SWHR3-T-0129), so a second insert fails.

Files: `lib/supplier-order-contacts.ts`, `lib/supplier-order-contacts.test.ts`.

Not done here: copying the contact from the order's SHIP_TO snapshot when POs are created (D4). That is in `createSupplierPOs`/allocation, outside this ticket's file ownership, so case SWHR3-C-0202's `createSupplierPOs` step is covered only through the write/read module.

AC coverage: "create and link ContactInfo with givenName, familyName, email, telephone" -> SWHR3-C-0202 (module level).

Verification: `bun run verify` exit 0 (880 tests passed).
