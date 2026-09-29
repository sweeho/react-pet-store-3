---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0044
branch: vortex/feat/SWHR3-T-0044-ejb-transaction-management-immediate-mod-9c1e63a3
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0044/PLAN.md]
---

# TDD result — SWHR3-T-0044

## Test cases

| Test                                                                                                                      | Covers             | Intent                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `lib/transaction.test.ts › commits a standalone write under behavior %s (C8)` (3 cases: deferred/immediate/exclusive)     | C8                 | the new `options.behavior` is accepted and each value still commits                        |
| `lib/transaction.test.ts › rolls back a standalone write under immediate mode when fn throws (C8)`                        | C8                 | rollback still works with the new option                                                   |
| `lib/transaction.test.ts › ignores a behavior option when joining an outer transaction (C8)`                              | C8                 | `outer` always wins; `options` is a standalone-only concern                                |
| `lib/order-approval.atomicity.test.ts › [SWHR3-C-0021] a three-order batch commits together in one transaction (AC-1)`    | SWHR3-C-0021, AC-1 | 3/3 applied, `{updated: 3}`, all three share one write                                     |
| `lib/order-approval.atomicity.test.ts › [SWHR3-C-0022] a failing second update leaves none of the three persisted (AC-2)` | SWHR3-C-0022, AC-2 | mid-batch `InvalidTransitionError` naming the failing order id, all three unchanged        |
| `lib/order-approval.atomicity.test.ts › [SWHR3-C-0023] overlapping batches on the same order cannot both succeed (AC-4)`  | SWHR3-C-0023, AC-4 | batch 1 commits; batch 2 fails `INVALID_TRANSITION`, batch 2's other order stays unchanged |

`SWHR3-C-0021`, `SWHR3-C-0022`, `SWHR3-C-0023` are this ticket's three platform-linked cases. `a2a_run_tests` refused to record red/green runs — "the sprint branch's `.vortex/config.yaml` has no `testEvidence` block, so this project records no red/green runs. Use the TDD-RESULT marker." — so their evidence is the marker below, same as every other test in this ticket.

## Red run

**`lib/transaction.test.ts` (C8, genuine red):** the new cases call `withTransaction(fn, outer, { behavior })` — a third argument the pre-change 2-parameter signature does not accept. Committed at `0839c53` with `lib/transaction.ts` unmodified, then:

```
$ bun run typecheck
lib/transaction.test.ts(6,23): error TS2305: Module '"./transaction"' has no exported member 'TransactionOptions'.
lib/transaction.test.ts(82,7): error TS2554: Expected 1-2 arguments, but got 3.
lib/transaction.test.ts(96,9): error TS2554: Expected 1-2 arguments, but got 3.
lib/transaction.test.ts(111,9): error TS2554: Expected 1-2 arguments, but got 3.
```

A real, reproducing compile failure — genuine red. (`vitest` itself does not type-check, so running it alone at this point would misleadingly pass; `typecheck` is what proves the new API doesn't exist yet.)

**`lib/order-approval.atomicity.test.ts` (SWHR3-C-0021/0022/0023): red was not obtainable, and here is why.** These three cases test whole-batch atomicity — that a failing change in a batch leaves nothing persisted. That guarantee comes from SQLite's ordinary transaction commit/rollback (`db.transaction(fn)` throws → rolls back), which `lib/orders.ts`'s `updateOrderStatus` and `lib/order-approval.ts`'s `updateOrders` already had before this ticket (proven independently by `lib/order-approval.test.ts › [SWHR3-C-0016]`, from SWHR3-T-0040, which rolls back an unknown-id batch). This ticket's actual change — immediate vs. deferred locking — only affects _when_ a second connection's write lock is acquired, which a single synchronous in-process `bun:sqlite` connection cannot observe; it does not affect whether a failed batch is atomic. Run against the code exactly as committed at `0839c53` (before either `lib/transaction.ts` or `lib/order-approval.ts` was touched):

```
$ NODE_ENV=test bun --bun vitest run lib/order-approval.atomicity.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

All three passed unchanged — a real run, not fabricated, showing the property already held. They remain in the suite as regression proof for the acceptance criteria and citing the linked case keys, verified green again after the real change below.

## Green run

`bun run verify` — this stack's full gate (lint + typecheck + complete unit suite):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  62 passed (62)
      Tests  388 passed (388)
```

`bun run verify:full` (adds the E2E tier) was attempted; its preflight reports Chromium is not
installed in this container (`[test:e2e] Playwright's Chromium browser is not installed`) and
explicitly directs engineer containers to `bun run verify` instead, deferring E2E to the
QA-phase/CI containers. This ticket adds no UI and no E2E spec (`PLAN.md`: "Design reference: None
— this ticket changes nothing a user sees"), so nothing was skipped by this.

TDD-RESULT: 388 passed, 0 failed
