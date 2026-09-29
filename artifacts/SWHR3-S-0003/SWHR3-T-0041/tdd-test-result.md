---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0041
branch: vortex/feat/SWHR3-T-0041-data-retrieval-and-filtering-get-api-adm-8b18abc4
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0041/PLAN.md]
---

# TDD result — SWHR3-T-0041

## Test cases

| Test                                                                                                                                        | Covers                 | Intent                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `routes/api/admin/orders/index.get.test.ts › [SWHR3-C-0034] returns all four status groups in one response, each seeded order exactly once` | SWHR3-C-0034, AC-1, C6 | one request returns all four groups, each order present exactly once |
| `routes/api/admin/orders/index.get.test.ts › answers 200 with four empty arrays when there are no orders (C6)`                              | C6                     | empty-db case: all four keys present as `[]`                         |
| `src/utils/sort-orders.test.ts › sorts by id ascending and descending`                                                                      | AC-3                   | numeric column, both directions                                      |
| `src/utils/sort-orders.test.ts › sorts by customerName ascending and descending`                                                            | AC-3                   | string column, both directions                                       |
| `src/utils/sort-orders.test.ts › sorts by orderDate ascending and descending`                                                               | AC-3                   | ISO-string column, both directions                                   |
| `src/utils/sort-orders.test.ts › sorts by totalCents ascending and descending`                                                              | AC-3                   | numeric column, both directions                                      |
| `src/utils/sort-orders.test.ts › sorts by status ascending and descending`                                                                  | AC-3                   | string column, both directions                                       |
| `src/utils/sort-orders.test.ts › breaks ties by id ascending, regardless of direction`                                                      | AC-3                   | tie-break rule                                                       |
| `src/utils/sort-orders.test.ts › returns a new array and never mutates its input`                                                           | AC-3                   | no-mutation, new-array guarantee                                     |

`SWHR3-C-0034` is this ticket's platform-linked case. `a2a_run_tests` refused to record a red/green run for it — "the sprint branch's `.vortex/config.yaml` has no `testEvidence` block, so this project records no red/green runs. Use the TDD-RESULT marker." — so its evidence is the marker below, same as every other test in this ticket. Its precondition text says "admin session"; this ticket does not own `middleware/auth.ts` (D4 admin-prefix enforcement is a different ticket's file ownership), so the test calls the handler directly with no session, matching `PLAN.md` step 1's scope.

## Red run

Committed the test files above plus stub production code (`routes/api/admin/orders/index.get.ts` and `src/utils/sort-orders.ts` each `throw new Error("VortexNotImplemented")`) at commit `65b35bb`, then:

```
$ NODE_ENV=test bun --bun vitest run routes/api/admin/orders/index.get.test.ts src/utils/sort-orders.test.ts

 ❯ |server| routes/api/admin/orders/index.get.test.ts (2 tests | 2 failed)
     × [SWHR3-C-0034] returns all four status groups in one response, each seeded order exactly once
     × answers 200 with four empty arrays when there are no orders (C6)
 ❯ |client| src/utils/sort-orders.test.ts (7 tests | 7 failed)
     × sorts by id ascending and descending
     × sorts by customerName ascending and descending
     × sorts by orderDate ascending and descending
     × sorts by totalCents ascending and descending
     × sorts by status ascending and descending
     × breaks ties by id ascending, regardless of direction
     × returns a new array and never mutates its input

 Test Files  2 failed (2)
      Tests  9 failed (9)
```

Every failure was the `VortexNotImplemented` sentinel thrown by the stub.

## Green run

`bun run verify` — this stack's full gate (lint + typecheck + complete unit suite):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  53 passed (53)
      Tests  318 passed (318)
```

`bun run verify:full` (adds the E2E tier) was attempted; its preflight reports Chromium is not
installed in this container (`[test:e2e] Playwright's Chromium browser is not installed`) and
explicitly directs engineer containers to `bun run verify` instead, deferring E2E to the
QA-phase/CI containers. This ticket adds no UI and no E2E spec (`PLAN.md`: "Design reference: None
— this ticket changes nothing a user sees"), so nothing was skipped by this.

TDD-RESULT: 318 passed, 0 failed
