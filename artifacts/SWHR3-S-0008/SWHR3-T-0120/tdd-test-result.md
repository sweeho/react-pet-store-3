---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0120
---

# TDD result — SWHR3-T-0120

## Test cases

`lib/order-records.test.ts` (in-memory db; orders written by `placeOrder`, the checkout entry point that exists at this point in the chain; `processOrder` arrives in a later ticket):

| Case         | Test                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWHR3-C-0178 | cart EST-1 × 2 at 1999 and EST-2 × 1 at 550: stored `total_cents` is 4548 and equals the sum of `quantity × unit_price_cents` over the lines                                                                                                                                                                                         |
| n/a          | whole order reads back at `workflowStage` PENDING with empty stage history, payment `null`, empty outbox, reservations and supplier POs; populated stage history and payment read back; `NotFoundError` for an unknown id; reads through a caller's transaction; `listOrdersByStage("PENDING")` includes it and `"SHIPPED"` does not |

## Red run

`bun run test lib/order-records.test.ts` with the schema and migration 0006 in place and `getOrderRecord` / `listOrdersByStage` as `VortexNotImplemented` stubs: 6 failed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 111 files, 726 tests passed. `bun run build` exit 0. Migration 0006 applies on the in-memory db during every test run.

TDD-RESULT: 726 passed, 0 failed
