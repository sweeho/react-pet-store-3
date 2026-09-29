---
artifact: tdd-test-result
ticket: SWHR3-T-0142
---

# TDD result — SWHR3-T-0142

## Test cases

`lib/supplier-workflow.atomicity.test.ts` (in-memory db; `insertSupplierAddress` and `processPendingSupplierOrders` wrapped so one call can be made to throw):

- SWHR3-C-0221: approving a CONFIRMED order through `updateOrders` while `insertSupplierAddress` throws leaves no PO, contact, address or reservation, stock unchanged at 5, and the order PENDING at CONFIRMED.
- extra: with the failure gone, the same approval succeeds (order APPROVED at ALLOCATED, stock 3), so the rollback left it retryable.
- SWHR3-C-0222: `applyInventoryUpdate` for EST-1 and EST-2 (both stock 1 to 9) while `processPendingSupplierOrders` throws: it throws and both quantities are still 1.
- SWHR3-C-0223: `applyInventoryUpdate` given an outer transaction calls `db.transaction` once, and the new quantity (12) is visible after commit.

## Red run

Not applicable. This ticket only proves behaviour that already exists (plan step 2: no production change), so the tests passed on their first run: 4 passed (4). No stub was possible without altering production code.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 138 files, 974 tests passed.

TDD-RESULT: 974 passed, 0 failed
