---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0038
branch: vortex/feat/SWHR3-T-0038-client-side-change-tracking-staged-decis-04797277
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0038/PLAN.md]
---

# TDD result — SWHR3-T-0038

`a2a_run_tests` was called first and refused: "The sprint branch's `.vortex/config.yaml` has no
`testEvidence` block, so this project records no red/green runs. Use the TDD-RESULT marker." This
file is that fallback.

## Test cases

| Test                                                                                                                                  | Covers           | Intent                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `src/hooks/use-staged-decisions.test.tsx › [SWHR3-C-0004] staging one order as APPROVED leaves the others untouched`                  | AC-3 (C10)       | `stage([id], "APPROVED")` sets only that order; others stay unstaged                                      |
| `src/hooks/use-staged-decisions.test.tsx › [SWHR3-C-0006] staging several selected orders as DENIED stages each one`                  | AC-3 (C10)       | `stage(ids, "DENIED")` stages every id in the batch, leaves the rest alone                                |
| `src/hooks/use-staged-decisions.test.tsx › [SWHR3-C-0008] toRequest serializes each staged change as orderId and status, ascending`   | AC-1, AC-3 (C10) | `toRequest()` returns one `{orderId,status}` entry per staged order, ascending by orderId                 |
| `src/hooks/use-staged-decisions.test.tsx › [SWHR3-C-0017] toRequest carries requestType UPDATESTATUS and one entry per changed order` | AC-2, AC-3 (C10) | `toRequest().requestType === "UPDATESTATUS"`, one entry per changed order, only `orderId`/`status` fields |
| `src/hooks/use-staged-decisions.test.tsx › staging an already-staged order replaces its status rather than adding a second entry`     | AC-3 (C10)       | re-staging replaces the Map entry instead of duplicating it                                               |
| `src/hooks/use-staged-decisions.test.tsx › unstage removes a single order's staged decision`                                          | AC-3 (C10)       | `unstage(id)` removes exactly that entry                                                                  |
| `src/hooks/use-staged-decisions.test.tsx › clear removes every staged decision`                                                       | AC-3 (C10)       | `clear()` empties the map                                                                                 |
| `src/hooks/use-staged-decisions.test.tsx › hasUncommittedChanges is false with nothing staged`                                        | AC-4             | empty map ⇒ `false`                                                                                       |
| `src/hooks/use-staged-decisions.test.tsx › hasUncommittedChanges is true once an order is staged`                                     | AC-4             | non-empty map ⇒ `true`                                                                                    |
| `src/hooks/use-staged-decisions.test.tsx › hasUncommittedChanges becomes false after clear()`                                         | AC-4             | `clear()` flips it back to `false`                                                                        |
| `src/hooks/use-staged-decisions.test.tsx › hasUncommittedChanges becomes false after unstaging the last order`                        | AC-4             | unstaging the last entry flips it back to `false`                                                         |

`src/types/order-approval.ts` (AC-5, C9) is a type-only file with no runtime behaviour; it is
proven by `tsc --build` in the green run and by every test above compiling against its exported
types (`OrderApprovalRequest`, `ChangedOrder`).

## Red run

`bun run test -- src/hooks/use-staged-decisions.test.tsx`, run against the committed test file plus
a `useStagedDecisions` stub whose body was `throw new Error("VortexNotImplemented")`:

```
 ❯ |client| src/hooks/use-staged-decisions.test.tsx (11 tests | 11 failed) 15ms
Error: VortexNotImplemented
 ❯ useStagedDecisions src/hooks/use-staged-decisions.ts:15:3

 Test Files  1 failed (1)
      Tests  11 failed (11)
```

All 11 failed on the stub's thrown sentinel, as expected before implementation.

## Green run

`bun run verify` (lint + typecheck + full unit suite — this project's full pre-commit validation
gate per `AGENTS.md`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  52 passed (52)
      Tests  320 passed (320)
```

`bun run verify:full` (the E2E tier) was also attempted; its preflight reported Chromium is not
installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing). Per
`AGENTS.md`, that is the expected engineer-container state — E2E runs in the QA/CI containers — so
`verify` is the correct fallback here and E2E was not retried. This ticket adds no E2E spec.

Isolated run of the new file for the record:

`bun run test -- src/hooks/use-staged-decisions.test.tsx`

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

TDD-RESULT: 320 passed, 0 failed
