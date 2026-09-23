---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0015
branch: vortex/feat/SWHR3-T-0015-9-customer-profile-service-api-and-accou-cb437870
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0015/PLAN.md]
---

# TDD result — SWHR3-T-0015

## Test cases

| Test                                                   | Covers           | Intent                                                                                                                                                                                              |
| ------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/customers.test.ts › createCustomer` (5 cases)     | AC-1, AC-2, AC-3 | create + mask card, `ProfileExistsError`, `DuplicateEmailError` (creates nothing), `ValidationError`, rollback when the card insert fails                                                           |
| `lib/customers.test.ts › getCustomerProfile` (2 cases) | AC-1             | `null` with no profile; every stored field on a real profile                                                                                                                                        |
| `lib/customers.test.ts › updateCustomer` (6 cases)     | AC-2, AC-4       | persists every modification, keeps the card when the number is blank, replaces it when a number is given, `NotFoundError`, `DuplicateEmailError` (changes nothing), keeping your own email          |
| `lib/customers.test.ts › deleteCustomer` (1 case)      | AC-4             | removes the customer and its card                                                                                                                                                                   |
| `routes/api/customers/index.post.test.ts` (5 cases)    | AC-4, AC-5       | 401, 201, 409 `PROFILE_EXISTS`, 409 `DUPLICATE_EMAIL`, 422                                                                                                                                          |
| `routes/api/customers/me.get.test.ts` (3 cases)        | AC-4, AC-5       | 401, 404, 200 with the persisted profile                                                                                                                                                            |
| `routes/api/customers/me.put.test.ts` (5 cases)        | AC-4, AC-5       | 401, 404, 200 + persists, 409 `DUPLICATE_EMAIL`, 422                                                                                                                                                |
| `src/pages/users/profile.test.tsx` (6 cases)           | AC-6, AC-7       | read-only user name + masked card, edit/save persists across a reload, Cancel resets the form, Sign out control present, 404 → `/users/create`, any other load failure thrown to the error boundary |

## Red run

`NODE_ENV=test bun --bun vitest run lib/customers.test.ts`, before `lib/customers.ts` existed:

```
FAIL |server| lib/customers.test.ts — Cannot find module './customers'
Test Files  1 failed (1)
```

`NODE_ENV=test bun --bun vitest run routes/api/customers/`, before the three route files existed:

```
FAIL |server| routes/api/customers/index.post.test.ts — Cannot find module './index.post'
FAIL |server| routes/api/customers/me.get.test.ts — Cannot find module './me.get'
FAIL |server| routes/api/customers/me.put.test.ts — Cannot find module './me.put'
Test Files  3 failed (3)
```

`NODE_ENV=test bun --bun vitest run src/pages/users/profile.test.tsx`, against the pre-existing static
placeholder page: all 6 cases failed (e.g. `TestingLibraryElementError: Unable to find an element with
the text: jgarrett`) — the placeholder renders "Current User / user@example.com" and has none of the
sections the tests look for.

```
Test Files  1 failed (1)
     Tests  6 failed (6)
```

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  33 passed (33)
      Tests  204 passed (204)
```

`bun run verify:full`'s E2E tier could not run: the preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed in this container — same documented AGENTS.md fallback as every
prior ticket this sprint. `verify` is the gate of record.

TDD-RESULT: 204 passed, 0 failed
