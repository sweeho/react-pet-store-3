---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0137
---

# TDD result — SWHR3-T-0137

## Test cases

`lib/supplier-fulfilment.test.ts`:

| Case         | Test                                                                                                                                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0206 | PENDING PO for EST-1 × 2 and EST-2 × 1, stock 5 and 1: `FULFILLED`, stock 3 and 0, two reservations, PO PROCESSING                                                                                                                                                                                                     |
| SWHR3-C-0213 | order at CONFIRMED with a PENDING PO for × 2 and stock 0: after stock is set to 2, `processPendingSupplierOrders` makes the PO PROCESSING, stock 0, stage ALLOCATED                                                                                                                                                    |
| n/a          | order ALLOCATED once every PO is PROCESSING; a two-line PO with one line short deducts neither and stays PENDING (`UNABLE` with `shortItems`); an item with no inventory row counts as 0; a non-PENDING PO is `SKIPPED`; still-short POs stay PENDING and count as processed not fulfilled; older POs are served first |

`lib/order-approval.test.ts`: SWHR3-C-0214 (approval with stock allocates immediately: PO PROCESSING, stock 3, stage ALLOCATED); the unstocked approval now also asserts a PENDING PO (SD9). `lib/process-manager.test.ts`: waiting order has one PENDING PO and nothing deducted; stocked allocation gives a PROCESSING PO; `retryWaitingAllocations` fulfils the waiting PO and returns the fulfilled count.

## Red run

`bun run test lib/supplier-fulfilment.test.ts lib/process-manager.test.ts lib/order-approval.test.ts` with the fulfilment functions as `VortexNotImplemented` stubs and `allocateOrder` unchanged: 10 failed, 16 passed. C-0214 passes in red because its behaviour was already true ("unchanged from the order-workflow behaviour"). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 132 files, 912 tests passed. `bun run build` exit 0.

TDD-RESULT: 912 passed, 0 failed
