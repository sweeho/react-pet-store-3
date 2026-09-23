---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0008
branch: vortex/feat/SWHR3-T-0008-2-new-customer-registration-panel-and-re-1c135fc3
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0008/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0008

## Test cases

| Test                                                                                                                 | Covers     | Intent                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `routes/api/auth/register.post.test.ts › answers 201 with the user, starts a session…`                               | AC-3, AC-4 | happy path: 201, `{ user }`, session cookie set                            |
| `routes/api/auth/register.post.test.ts › answers 409 DUPLICATE_ACCOUNT for a taken user name`                        | AC-3       | second registration of the same user name is rejected                      |
| `routes/api/auth/register.post.test.ts › answers 422 with fieldErrors.j_password_confirm when the passwords differ`  | AC-4       | server-side confirmation mismatch, keyed by parameter name                 |
| `routes/api/auth/register.post.test.ts › answers 422 with fieldErrors.j_password for a too-short password`           | AC-4       | password rule violation, keyed by parameter name                           |
| `routes/api/auth/register.post.test.ts › answers 422 with fieldErrors.j_username for a user name breaking the rules` | AC-4       | user-name rule violation, keyed by parameter name                          |
| `signin.test.tsx › renders the registration fields, a Confirm password field, and a Create new account button`       | AC-1       | fields + names + button render                                             |
| `signin.test.tsx › submits j_username/j_password/j_password_confirm and navigates to /users/create on success`       | AC-2/3/4/5 | POST body shape, 201 handling, navigation to `/users/create`               |
| `signin.test.tsx › shows "That user name is already taken" and keeps the entered user name on a 409`                 | AC-6       | duplicate heading + body + retained user-name field                        |
| `signin.test.tsx › reports a password/confirmation mismatch on the confirmation field and sends no request`          | AC-7       | client-side mismatch check blocks the request                              |
| 6 pre-existing Returning-customer-panel tests (unchanged assertions, rescoped queries)                               | n/a        | still green after the New customer panel gained real, same-labelled fields |

## Red run

`NODE_ENV=test bun --bun vitest run routes/api/auth/register.post.test.ts` — against `routes/api/auth/register.post.ts` stubbed to `throw new Error("not implemented")`:

```
 Test Files  1 failed (1)
      Tests  5 failed (5)
```

`NODE_ENV=test bun --bun vitest run src/pages/signin.test.tsx` — against the pre-ticket `src/pages/signin.tsx` (git `HEAD`: no `aria-label` on the Returning customer section, "Coming soon." placeholder in the New customer panel):

```
 Test Files  1 failed (1)
      Tests  10 failed (10)
```

All 10 failed — the 6 pre-existing tests fail too, because they are now scoped through `getByRole("region", { name: "Returning customer" })`, which does not exist until the `aria-label` this ticket adds is present. This confirms the region-scoping is load-bearing, not decorative.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`), with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  32 passed (32)
      Tests  196 passed (196)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`) and instructed falling back to `verify` — expected in an engineer container per AGENTS.md (E2E runs in the QA phase / CI).

TDD-RESULT: 196 passed, 0 failed
