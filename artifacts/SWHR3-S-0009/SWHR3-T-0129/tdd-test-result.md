---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0129
---

# TDD result — SWHR3-T-0129

## Test cases

| Case         | Test                                                                                                                                                                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0198 | `lib/supplier-order-status.test.ts`: for all nine (from, to) pairs of PENDING, PROCESSING, COMPLETED `assertSupplierOrderTransition(1, from, to)` passes only for PENDING→PROCESSING and PROCESSING→COMPLETED and throws `InvalidTransitionError` for the other seven; the legal set is exactly those two |
| SWHR3-C-0198 | `lib/supplier-order-status.migration.test.ts`: runs the real migration files on a scratch in-memory db, up to 0006, inserts POs with status `OPEN` and `SHIPPED`, applies 0007: they read `PROCESSING` and `COMPLETED`; a PO inserted without a status defaults to `PENDING`                              |
| n/a          | `lib/supplier-pos.test.ts` and `lib/process-manager.test.ts`: existing tests updated for the status literals only (`createSupplierPOs` writes PROCESSING, `markPoShipped` gives COMPLETED, `recordShipment` completes the order when every PO is COMPLETED)                                               |

## Red run

`bun run test lib/supplier-order-status lib/supplier-pos.test.ts lib/process-manager.test.ts` with the schema and migration generated but not yet mapping statuses, `assertSupplierOrderTransition` a `VortexNotImplemented` stub and the literals unchanged in production: 15 failed, 11 passed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 127 files, 868 tests passed. `bun run build` exit 0.

TDD-RESULT: 868 passed, 0 failed
