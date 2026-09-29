---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0119
---

# TDD result — SWHR3-T-0119

## Test cases

All in `lib/order-workflow.atomicity.test.ts` (in-memory db; `queueOrderConfirmation` and `createSupplierPOs` are wrapped so a test can make them throw once):

| Case         | Test                                                                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0166 | a declined card throws `PaymentDeclinedError`; `orders`, `order_contacts`, `line_items`, `payment_authorizations`, `notification_outbox` and `order_stage_history` counts unchanged; cart still holds both items |
| SWHR3-C-0175 | `queueOrderConfirmation` throws after payment was written: same counts unchanged, cart intact                                                                                                                    |
| SWHR3-C-0177 | `processOrder` inside `withTransaction` joins it: `db.transaction` called once, the order exists after commit                                                                                                    |
| SWHR3-C-0176 | `createSupplierPOs` throws inside `allocateOrder`: inventory quantities unchanged, no reservation row added, stage still CONFIRMED                                                                               |
| n/a          | after that rollback the same order allocates normally (retryable)                                                                                                                                                |

## Red run

None. This ticket proves atomicity of `processOrder` (T-0117) and `allocateOrder` (T-0118), which already exist, and the plan says to change no production file, so all five tests passed on first run. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0, after merging the sprint branch into this one (it carried T-0118's `lib/process-manager.ts`): 124 files, 854 tests passed (the 5 in this file included).

TDD-RESULT: 854 passed, 0 failed
