---
artifact: tdd-test-result
ticket: SWHR3-T-0116
---

# TDD result — SWHR3-T-0116

## Test cases

- `lib/supplier-pos.test.ts`: SWHR3-C-0174 twice (one supplier: one OPEN PO due exactly 7 days after a fixed `now`, every line references it; `supplierForItem` stubbed to two suppliers: two POs, lines linked to the right one). `markPoShipped`: stores SHIPPED, tracking number and `shippedAt`; unknown PO throws `NotFoundError`; already-shipped PO throws `InvalidTransitionError` and keeps its number.
- `lib/suppliers.test.ts`: default supplier for every item, lead time 7.

## Red run

`bun --bun vitest run lib/supplier-pos.test.ts lib/suppliers.test.ts` with `createSupplierPOs`/`markPoShipped` stubbed to throw `VortexNotImplemented`: 5 failed | 2 passed (7). The 2 passing are the `suppliers.ts` constants test, which had no stub to fail.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 113 files, 733 tests passed.

TDD-RESULT: 733 passed, 0 failed
