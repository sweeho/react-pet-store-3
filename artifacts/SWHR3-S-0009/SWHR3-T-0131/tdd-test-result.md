---
artifact: tdd-test-result
ticket: SWHR3-T-0131
---

# TDD result — SWHR3-T-0131

## Test cases

`lib/supplier-order-addresses.test.ts` (in-memory db, PO and contact written directly):

- SWHR3-C-0203: all six fields round-trip with a null `address2`; a given line 2 is kept; inserting an address without a contact fails (foreign key) and leaves no address.
- extra: `getSupplierAddress` for a PO with no address throws `NotFoundError`.

The case text also names `createSupplierPOs`; copying the SHIP_TO snapshot at PO creation belongs to the allocation ticket, so this test covers the address module that copy writes through.

## Red run

`bun --bun vitest run lib/supplier-order-addresses.test.ts` against stubs throwing `VortexNotImplemented`: 4 failed (4).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 129 files, 887 tests passed.

TDD-RESULT: 887 passed, 0 failed
