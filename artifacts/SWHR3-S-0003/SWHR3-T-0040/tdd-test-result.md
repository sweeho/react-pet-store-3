---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0040
branch: vortex/feat/SWHR3-T-0040-business-delegate-implementation-updateo-84a5c3fe
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0040/PLAN.md]
---

# TDD result — SWHR3-T-0040

`a2a_run_tests` was called first, per the ticket's linked-case instructions, and refused:
"The sprint branch's `.vortex/config.yaml` has no testEvidence block, so this project
records no red/green runs. Use the TDD-RESULT marker." This file follows that fallback.

## Test cases

| Test                                                                                                                                | Covers     | Intent                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `lib/order-approval.test.ts › updateOrders › [SWHR3-C-0013] applies every change in the batch and returns the count`                | AC-2       | a valid batch is applied through `updateOrders` and `{ updated }` matches the change count                |
| `lib/order-approval.test.ts › updateOrders › [SWHR3-C-0016] rolls back the whole batch when one order id is unknown`                | AC-1, AC-3 | an unknown id throws `NotFoundError` unchanged and leaves both other orders' status/`updatedAt` untouched |
| `lib/order-approval.test.ts › updateOrders › rolls back the whole batch when one order is no longer PENDING`                        | AC-1, AC-3 | a non-PENDING row throws `InvalidTransitionError` unchanged and leaves the batch untouched                |
| `lib/order-approval.test.ts › updateOrders › writes exactly one log line naming each order and its new status, without a user name` | AC-4       | a successful commit logs `order-approval: committed N (id→STATUS, …)` once, with no username in the line  |
| `lib/order-approval.test.ts › updateOrders › writes no log line when the batch fails`                                               | AC-4       | a failing commit writes no log line                                                                       |

`SWHR3-C-0013`/`SWHR3-C-0016`'s recorded steps reach `updateOrders` through the admin HTTP
route; that route is a different ticket's file (design.md ticket map, group 4). This
ticket owns only `lib/order-approval.ts`, so both tests call the service directly with
the same batch shape and expected outcome the case describes.

## Red run

`bun run test -- lib/order-approval.test.ts`, with `lib/order-approval.ts` a stub
(`export function updateOrders() { throw new Error("VortexNotImplemented"); }`), committed
at `b7aa7f0`.

```
FAIL  |server| lib/order-approval.test.ts > updateOrders > [SWHR3-C-0013] applies every change in the batch and returns the count
Error: VortexNotImplemented
 ❯ updateOrders lib/order-approval.ts:15:3
...
 Test Files  1 failed (1)
      Tests  5 failed (5)
```

All 5 tests failed on the sentinel (not a compile error), reproducing the expected red.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck
&& bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  52 passed (52)
      Tests  314 passed (314)
```

`bun run verify:full` (adds the E2E tier) was attempted per the workflow's preference, but
this container has no Chromium installed (`ensure-playwright-browser.mjs`: "Playwright's
Chromium browser is not installed"). Per AGENTS.md/the E2E preflight, this is not retried
and no browser is installed here — E2E for the sprint runs in Validation's
browser-equipped container. `bun run verify` above is the full gate this ticket's change
is validated against, and it is green with zero new failures (314/314, unchanged from the
pre-ticket baseline plus this ticket's 5 new tests).

TDD-RESULT: 314 passed, 0 failed
