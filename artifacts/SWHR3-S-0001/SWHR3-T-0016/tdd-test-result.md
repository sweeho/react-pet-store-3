---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0016
branch: vortex/feat/SWHR3-T-0016-10-service-errors-and-http-error-mapping-d0a5d10c
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0016/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0016

## Test cases

| Test                                                                                                                             | Covers     | Intent                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/errors.test.ts › carries the code, message and status passed to the base class`                                             | AC-3       | `ServiceError(code, message, status)` base constructor                                                                                          |
| `lib/errors.test.ts › DuplicateAccountError is a 409 DUPLICATE_ACCOUNT`                                                          | AC-3       | subclass status/code                                                                                                                            |
| `lib/errors.test.ts › DuplicateEmailError is a 409 DUPLICATE_EMAIL`                                                              | AC-3       | subclass status/code                                                                                                                            |
| `lib/errors.test.ts › ProfileExistsError is a 409 PROFILE_EXISTS`                                                                | AC-3       | subclass status/code                                                                                                                            |
| `lib/errors.test.ts › NotFoundError is a 404 NOT_FOUND`                                                                          | AC-3       | subclass status/code                                                                                                                            |
| `lib/errors.test.ts › ServiceUnavailableError is a 503 SERVICE_UNAVAILABLE`                                                      | AC-3       | subclass status/code                                                                                                                            |
| `lib/errors.test.ts › ValidationError is a 422 VALIDATION_FAILED carrying fieldErrors`                                           | AC-3       | `fieldErrors` passthrough                                                                                                                       |
| `lib/errors.test.ts › every subclass accepts a custom message`                                                                   | AC-3       | overridable message                                                                                                                             |
| `lib/errors.test.ts › maps a ServiceError to an h3 error carrying status, message and data.code`                                 | AC-4       | `toHttpError` basic mapping                                                                                                                     |
| `lib/errors.test.ts › maps a ValidationError's fieldErrors into data.fieldErrors alongside data.code`                            | AC-4       | `toHttpError` fieldErrors mapping                                                                                                               |
| `lib/errors.test.ts › maps every other thrown value to a 500 that leaks neither message nor stack, and logs once`                | AC-5       | unknown-error masking + single log                                                                                                              |
| `lib/errors.test.ts › maps a thrown string/number/plain object to a safe 500 too`                                                | AC-5       | non-Error thrown values                                                                                                                         |
| `lib/errors.test.ts › passes an existing h3 error through unchanged`                                                             | AC-4       | h3 error passthrough                                                                                                                            |
| `routes/api/errors-contract.test.ts › a ServiceError thrown by a service surfaces as message + data.code through a real handler` | AC-4       | serialized body shape via a real `H3Event` handler                                                                                              |
| `routes/api/errors-contract.test.ts › a ValidationError surfaces data.fieldErrors alongside data.code through a real handler`    | AC-4       | serialized body shape, `fieldErrors`                                                                                                            |
| `routes/api/errors-contract.test.ts › a NotFoundError surfaces as a 404 through a real handler`                                  | AC-4       | serialized body shape, 404                                                                                                                      |
| `routes/api/errors-contract.test.ts › an unexpected throw inside a route surfaces as a generic, non-leaking 500`                 | AC-5       | serialized body has no leaked message/stack, one log call                                                                                       |
| `lib/errors.test.ts` (module presence)                                                                                           | AC-1, AC-2 | `lib/errors.ts` module doc records that services are statically imported, so there is no ServiceLocator/JNDI lookup to test (design.md SD3/SD4) |

## Red run

`NODE_ENV=test bun --bun vitest run lib/errors.test.ts routes/api/errors-contract.test.ts` — before `lib/errors.ts` existed:

```
FAIL  |server| lib/errors.test.ts [ lib/errors.test.ts ]
Error: Cannot find module './errors' imported from /workspace/repo/lib/errors.test.ts

FAIL  |server| routes/api/errors-contract.test.ts [ routes/api/errors-contract.test.ts ]
Error: Cannot find module '../../lib/errors' imported from /workspace/repo/routes/api/errors-contract.test.ts

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  10 passed (10)
      Tests  44 passed (44)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. No E2E spec was touched by this ticket (backend-only, no route wiring or UI change).

TDD-RESULT: 44 passed, 0 failed
