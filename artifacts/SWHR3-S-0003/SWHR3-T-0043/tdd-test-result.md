---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0043
branch: vortex/feat/SWHR3-T-0043-client-server-integration-admin-orders-a-d6cf8a26
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0043/PLAN.md]
---

# TDD result — SWHR3-T-0043

`a2a_run_tests` was refused on the two prior tickets in this sprint ("no `testEvidence` block
on this sprint's `.vortex/config.yaml`"); reused the `TDD-RESULT:` marker fallback directly.

## Test cases

| Test                                                                                                                                                            | Covers                           | Intent                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/utils/admin-orders-api.test.ts › GETs /api/admin/orders with same-origin credentials and returns the grouped orders`                                       | C11                              | `fetchOrdersByStatus()` → `GET /api/admin/orders`, `credentials: "same-origin"`, unwraps `{ orders }`       |
| `src/utils/admin-orders-api.test.ts › [SWHR3-C-0029] surfaces a 401 ApiError unchanged when there is no session cookie`                                         | C11, SD8                         | a 401 response rejects with the same `ApiError` `apiFetch` builds                                           |
| `src/utils/admin-orders-api.test.ts › [SWHR3-C-0007] POSTs /api/admin/orders/status with the whole request body, exactly once`                                  | AC-1, C11                        | `commitOrderDecisions(request)` → exactly one `POST`, body equals the full request                          |
| `src/utils/admin-orders-api.test.ts › surfaces the ApiError unchanged on failure, with status and server message preserved (C11)`                               | C11                              | a 409 response rejects with status/message/code preserved                                                   |
| `src/utils/admin-orders-api.test.ts › surfaces a 403 ApiError unchanged`                                                                                        | C11                              | a 403 response rejects with status/message preserved                                                        |
| `src/components/admin/commit-decisions-dialog.test.tsx › renders nothing when closed`                                                                           | —                                | `open={false}` renders no dialog                                                                            |
| `src/components/admin/commit-decisions-dialog.test.tsx › lists each staged change as PENDING → STATUS and states all-or-nothing`                                | design ref (confirmation mockup) | the confirm view lists every `orderId`/target status                                                        |
| `src/components/admin/commit-decisions-dialog.test.tsx › cancel closes without sending any request`                                                             | AC-5                             | Cancel calls `onClose`, never touches `fetch`                                                               |
| `src/components/admin/commit-decisions-dialog.test.tsx › [SWHR3-C-0007] commit sends every staged change in exactly one POST and reports the updated count`     | AC-1/AC-5, C11                   | clicking Commit sends one POST with the full body and shows "N decisions committed"; `onCommitted(3)` fires |
| `src/components/admin/commit-decisions-dialog.test.tsx › [SWHR3-C-0020] a non-403 failure shows the server message and keeps staging (onCommitted never fires)` | AC-5                             | a 409 failure shows the exact server message; `onCommitted` never fires                                     |
| `src/components/admin/commit-decisions-dialog.test.tsx › a 403 failure always shows "Administrator credentials required" and keeps staging`                     | AC-5                             | a 403 failure always shows that exact string; `onCommitted` never fires                                     |
| `src/components/admin/commit-decisions-dialog.test.tsx › closing the failure state calls onClose`                                                               | design ref (failure mockup)      | the failure view's Close button calls `onClose`                                                             |
| `src/components/admin/commit-decisions-dialog.test.tsx › resets to the confirmation view the next time it is opened with a new request`                         | design ref                       | reopening with a new request shows the confirm view again, not a stale success/error state                  |

`[SWHR3-C-0029]`'s full scenario (an admin session cookie reaching `GET /api/admin/orders`
end-to-end, 401 without one) was already proven at the middleware+route level in
SWHR3-T-0045's `middleware/auth.test.ts`. Here it is covered at the level this ticket owns:
`fetchOrdersByStatus()` sends the request with `credentials: "same-origin"` (so the browser
attaches the cookie) and surfaces a 401 unchanged when the server rejects it.

## Red run

`bun run test -- src/utils/admin-orders-api.test.ts src/components/admin/commit-decisions-dialog.test.tsx`,
run with `fetchOrdersByStatus`/`commitOrderDecisions`/`CommitDecisionsDialog` all stubbed to
`throw new Error("VortexNotImplemented")`:

```
 Test Files  2 failed (2)
      Tests  13 failed (13)
```

All 13 failed on the sentinel throw (the API stubs) or the component throwing during render
(the dialog stub), as expected before implementation.

## Green run

`bun run verify` (lint + typecheck + full unit suite — this project's full pre-commit
validation gate per `AGENTS.md`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  63 passed (63)
      Tests  393 passed (393)
```

The first `bun run verify` attempt caught a real defect before it reached committed code:
`react-hooks/set-state-in-effect` on a `useEffect` that reset the dialog's phase whenever it
reopened. Fixed by adjusting state during render (comparing against a `priorOpen` state
variable) instead — the same technique `src/hooks/use-session.ts` already uses for its
`loading` derivation — then re-ran `verify` clean.

`bun run verify:full` was also attempted; its E2E preflight reported Chromium is not
installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing).
Per `AGENTS.md`, that is the expected engineer-container state — E2E runs in the QA/CI
containers — so `verify` is the correct fallback here and E2E was not retried. This ticket
adds no E2E spec (see Notes in `summary.md` for `[SWHR3-C-0020]`).

Isolated run of the two touched/new test files for the record:

`bun run test -- src/utils/admin-orders-api.test.ts src/components/admin/commit-decisions-dialog.test.tsx`

```
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

TDD-RESULT: 393 passed, 0 failed
