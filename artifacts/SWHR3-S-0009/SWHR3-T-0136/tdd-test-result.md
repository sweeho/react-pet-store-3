---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0136
---

# TDD result — SWHR3-T-0136

## Test cases

`lib/inventory-update.test.ts` (in-memory db):

| Case         | Test                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0212 | two waiting orders, PO A needing EST-1 × 2 and PO B needing EST-2 × 5, stock 0 and 0; `applyInventoryUpdate([EST-1 = 3])` returns `processedOrders` 2 and `fulfilledOrders` 1: PO A PROCESSING, EST-1 stock 1, order ALLOCATED; PO B still PENDING                                                          |
| SWHR3-C-0208 | EST-1 stock 40, EST-2 stock 7; updating to 0 and 25 returns `updated ["EST-1", "EST-2"]` and stores 0 and 25                                                                                                                                                                                                |
| n/a          | an update covering a waiting PO fulfils it in the same call; an empty list changes nothing but still reprocesses; each item's quantity is logged before and after; one immediate transaction, or the caller's is joined; a failing update (item not in the catalogue) rolls back the quantities already set |

## Red run

`bun run test lib/inventory-update.test.ts` against a `VortexNotImplemented` stub: 6 failed, 1 passed. The rollback test passes in red only because the stub also throws; it checks the right thing after implementation.

An intermediate run after implementing failed once: `[SWHR3-C-0208]` saw EST-2 = 20, not 25, because PO B left pending by the first test was correctly fulfilled (−5) by the reprocessing. That was test isolation, not a defect, so the tests after the first now clear leftover PENDING POs first. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 135 files, 957 tests passed. `bun run build` exit 0.

TDD-RESULT: 957 passed, 0 failed
