---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0045
branch: vortex/feat/SWHR3-T-0045-error-handling-and-validation-request-pa-719b5b91
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0045/PLAN.md]
---

# TDD result — SWHR3-T-0045

`a2a_run_tests` was called first and refused on the previous ticket in this sprint with:
"The sprint branch's `.vortex/config.yaml` has no `testEvidence` block, so this project
records no red/green runs. Use the TDD-RESULT marker." Same project, same config, so this
file is that fallback again, without re-calling the tool.

## Test cases

| Test                                                                                                      | Covers        | Intent                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/order-approval-request.test.ts › [SWHR3-C-0014] extracts orderId and status from each change`        | AC-1, C5      | valid request → `{ changes: [{orderId,status}, …] }`                                                                                                                                                                                                                                                            |
| `lib/order-approval-request.test.ts › [SWHR3-C-0015] rejects a change with an invalid orderId or status`  | C5            | `orderId: 0` and `status: "COMPLETED"` each produce their own `changes.<i>.*` fieldError                                                                                                                                                                                                                        |
| `lib/order-approval-request.test.ts › [SWHR3-C-0030] rejects a requestType other than UPDATESTATUS…`      | C5, AC-2      | `requestType: "GETORDERS"` throws with a `requestType` fieldError, i.e. never reaches `updateOrders` (see Notes)                                                                                                                                                                                                |
| `lib/order-approval-request.test.ts › [SWHR3-C-0031] turns a single request entry into a ChangedOrder`    | AC-2/AC-3, C5 | one entry round-trips to one `ChangedOrder`                                                                                                                                                                                                                                                                     |
| `lib/order-approval-request.test.ts › [SWHR3-C-0032] collects every parsed change into one OrderApproval` | AC-3, C5      | five entries → one `OrderApproval` with five `changes`                                                                                                                                                                                                                                                          |
| `lib/order-approval-request.test.ts › [SWHR3-C-0033] rejects a request with a duplicate orderId`          | C5            | two entries for the same `orderId` → fieldError on the second index                                                                                                                                                                                                                                             |
| `lib/order-approval-request.test.ts › rejects a missing or empty changes array`                           | C5            | absent/`[]` `changes` → `changes` fieldError                                                                                                                                                                                                                                                                    |
| `lib/order-approval-request.test.ts › rejects more than 500 changes`                                      | C5            | 501 entries → `changes` fieldError                                                                                                                                                                                                                                                                              |
| `lib/order-approval-request.test.ts › rejects a non-integer or non-positive orderId`                      | C5            | `-1` and `1.5` each → their own `orderId` fieldError                                                                                                                                                                                                                                                            |
| `lib/roles.test.ts › defaults a newly created account to "customer"`                                      | D3            | no explicit role ⇒ `"customer"`                                                                                                                                                                                                                                                                                 |
| `lib/roles.test.ts › returns "admin" for an account granted the admin role`                               | D3            | `role: "admin"` row ⇒ `"admin"`                                                                                                                                                                                                                                                                                 |
| `lib/roles.test.ts › reflects a role change on the very next read, without any caching`                   | D3, AC-4/C6   | update then re-read, no memoisation                                                                                                                                                                                                                                                                             |
| `lib/roles.test.ts › treats an unknown accountId as "customer" rather than throwing`                      | D3            | no matching row ⇒ safe default, no throw                                                                                                                                                                                                                                                                        |
| `lib/protected-resources.test.ts › ADMIN_API_PREFIX / isAdminApiPath (3 tests)`                           | D4            | `"/api/admin/"` is the prefix; matches anything under it; not the bare prefix or an unrelated path                                                                                                                                                                                                              |
| `middleware/auth.test.ts › admin paths (6 tests, incl. [SWHR3-C-0026] and [SWHR3-C-0029])`                | AC-4, C6      | 401 no session; 403 signed-in non-admin (order left untouched); pass-through for admin; admin cookie reaches the existing GET /api/admin/orders handler (200) and no cookie still 401s; role revoked mid-session 403s on the very next request without sign-out; existing exact-match customer paths unaffected |
| `routes/api/session.get.test.ts › role tests (incl. [SWHR3-C-0028])`                                      | AC-4, C6      | active session ⇒ `user.role` "customer"/"admin"; sign-in's Set-Cookie is HttpOnly + SameSite=Lax and the cookie it issues carries the admin role through GET /api/session                                                                                                                                       |
| `src/hooks/use-session.test.tsx › role tests`                                                             | C6            | `SessionUser.role` passes through for both roles (type-only change — see Notes)                                                                                                                                                                                                                                 |

`db/grant-admin.ts` (AC-7, D12) is not test-owned by this ticket — `PLAN.md` step 6 defers
its end-to-end exercise to SWHR3-T-0047. Verified by manual smoke run instead (see
`summary.md` § Verification): no-arg → usage + exit 1; unknown user → clear message + exit
1; known user → `role` set to `"admin"` in the db.

## Red run

`bun run test -- lib/order-approval-request.test.ts lib/roles.test.ts lib/protected-resources.test.ts middleware/auth.test.ts routes/api/session.get.test.ts src/hooks/use-session.test.tsx`,
run with `parseOrderApprovalRequest`/`getAccountRole`/`isAdminApiPath` stubbed to
`throw new Error("VortexNotImplemented")` and `middleware/auth.ts` / `routes/api/session.get.ts`
/ `src/hooks/use-session.ts` still in their pre-ticket state:

```
 Test Files  5 failed | 1 passed (6)
      Tests  23 failed | 19 passed (42)
```

All 23 failures were the new tests, failing either on the sentinel throw (new functions) or
on missing `role`/403 behaviour (existing files not yet touched) — see Notes for why
`src/hooks/use-session.test.tsx` alone stayed green at this point.

## Green run

`bun run verify` (lint + typecheck + full unit suite — this project's full pre-commit
validation gate per `AGENTS.md`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  57 passed (57)
      Tests  359 passed (359)
```

`bun run verify:full` was also attempted; its E2E preflight reported Chromium is not
installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing).
Per `AGENTS.md`, that is the expected engineer-container state — E2E runs in the QA/CI
containers — so `verify` is the correct fallback here and E2E was not retried. This ticket
adds no E2E spec.

Isolated run of the six touched/new test files for the record:

`bun run test -- lib/order-approval-request.test.ts lib/roles.test.ts lib/protected-resources.test.ts middleware/auth.test.ts routes/api/session.get.test.ts src/hooks/use-session.test.tsx`

```
 Test Files  6 passed (6)
      Tests  42 passed (42)
```

TDD-RESULT: 359 passed, 0 failed
