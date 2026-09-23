---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0014
branch: vortex/feat/SWHR3-T-0014-8-create-customer-page-7950de0e
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0014/PLAN.md]
---

# TDD result — SWHR3-T-0014

## Test cases

| Test                                                                                                             | Covers     | Intent                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `create.test.tsx › shows the signed-in user name read-only, and the three sections with their fields`            | AC-1, AC-2 | user name from `GET /api/session` displayed as text (not editable), all three mockup sections and their fields present |
| `create.test.tsx › marks every field required except Street address line 2 (AC-5)`                               | AC-5       | `required` on a representative field per section; street2 explicitly not required                                      |
| `create.test.tsx › blocks submission when a required field is empty (AC-5)`                                      | AC-5       | clicking Create account with the form empty never calls `fetch` (native HTML5 validation blocks it)                    |
| `create.test.tsx › submits a CustomerProfileInput to POST /api/customers and navigates to /users/profile on 201` | AC-3, AC-4 | POST body shape matches `CustomerProfileInput`; 201 → `/users/profile`                                                 |
| `create.test.tsx › maps 422 field errors under their fields and keeps every entered value`                       | AC-4       | `fieldErrors` (dotted paths) rendered under their fields; every typed value survives the failed submit                 |
| `create.test.tsx › shows the duplicate-email error under Email on a 409`                                         | AC-4       | `DUPLICATE_EMAIL` (no `data.fieldErrors` of its own) is mapped onto the Email field specifically                       |

## Red run

`NODE_ENV=test bun --bun vitest run src/pages/users/create.test.tsx`, before `src/pages/users/create.tsx`
existed:

```
FAIL |client| src/pages/users/create.test.tsx [ src/pages/users/create.test.tsx ]
Error: Failed to resolve import "./create" from "src/pages/users/create.test.tsx". Does the file exist?
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  44 passed (44)
      Tests  263 passed (263)
```

`bun run verify:full`'s E2E tier could not run: the preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed in this container — same documented AGENTS.md fallback as every
prior ticket this sprint. `verify` is the gate of record.

TDD-RESULT: 263 passed, 0 failed
