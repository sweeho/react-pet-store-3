---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0090
---

# TDD result — SWHR3-T-0090

## Test cases

| Case         | Test (lib/purchase-orders.test.ts)                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0106 | different billing and shipping addresses read back as two `order_contacts` rows (BILL_TO Palo Alto, SHIP_TO San Francisco)                      |
| SWHR3-C-0125 | `toPurchaseOrder` sets `emailId` to the billing email though shipping has another                                                               |
| n/a          | total in cents; null `address2` stays null; order row (PENDING, name, card snapshot, date); line items numbered from 1; rollback writes nothing |

## Red run

`bun run test lib/purchase-orders.test.ts` against `VortexNotImplemented` stubs (schema and migration 0005 already in place): 7 failed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 95 files, 579 tests passed.

TDD-RESULT: 579 passed, 0 failed
