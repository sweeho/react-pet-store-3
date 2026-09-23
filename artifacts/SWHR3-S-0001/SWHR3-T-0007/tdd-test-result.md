---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0007
branch: vortex/feat/SWHR3-T-0007-1-sign-on-page-and-sign-in-api-with-reme-f8c08397
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0007/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0007

## Test cases

| Test                                                                                                                               | Covers      | Intent                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `routes/api/auth/signin.post.test.ts › answers 200 with the user and starts a session on valid credentials`                        | AC-4, AC-7  | verifyCredentials match starts a session, returns `{ user }` |
| `routes/api/auth/signin.post.test.ts › answers 401 and sets no session cookie on a wrong password`                                 | AC-7        | wrong password → 401, no session cookie                      |
| `routes/api/auth/signin.post.test.ts › answers 401 for an unknown user name`                                                       | AC-4, AC-7  | unknown user → 401                                           |
| `routes/api/auth/signin.post.test.ts › answers 422 through ValidationError when j_username or j_password is missing`               | AC-3, AC-7  | missing field → 422 VALIDATION_FAILED                        |
| `routes/api/auth/signin.post.test.ts › sets bp_signon with the user name when j_remember_username is true`                         | AC-5        | remember cookie set, not httpOnly                            |
| `routes/api/auth/signin.post.test.ts › deletes bp_signon when j_remember_username is false or absent`                              | AC-8        | remember cookie deleted on false/absent                      |
| `src/utils/cookies.test.ts › returns undefined when the cookie is not set`                                                         | AC-2, AC-6  | `readCookie` base case                                       |
| `src/utils/cookies.test.ts › returns the value of a cookie that is set`                                                            | AC-2, AC-6  | `readCookie` happy path                                      |
| `src/utils/cookies.test.ts › decodes a URI-encoded value`                                                                          | AC-2, AC-6  | `readCookie` decoding                                        |
| `src/utils/cookies.test.ts › picks the right cookie among several`                                                                 | AC-2, AC-6  | `readCookie` selection among several cookies                 |
| `src/pages/signin.test.tsx › renders the returning-customer fields with their form names, and a New customer panel`                | AC-1, AC-10 | field names, checkbox, button, panel layout                  |
| `src/pages/signin.test.tsx › pre-populates the user name field from the bp_signon cookie`                                          | AC-2, AC-6  | cookie prefill                                               |
| `src/pages/signin.test.tsx › leaves the user name field empty when there is no bp_signon cookie`                                   | AC-2, AC-6  | no-cookie case                                               |
| `src/pages/signin.test.tsx › submits j_username/j_password/j_remember_username and navigates to a same-origin redirect on success` | AC-3, AC-9  | request body shape, redirect honoured                        |
| `src/pages/signin.test.tsx › navigates to /users/profile when redirect is absent or not a single leading slash`                    | AC-9        | open-redirect guard (`//host`), fallback                     |
| `src/pages/signin.test.tsx › shows an inline error and does not navigate when sign-in fails`                                       | —           | minimal failure UI (SWHR3-T-0009 owns the designed state)    |

## Red run

Each new module was temporarily moved aside and its test run in isolation to confirm a genuine failure, then restored:

```
$ mv routes/api/auth/signin.post.ts /tmp/… && NODE_ENV=test bun --bun vitest run routes/api/auth/signin.post.test.ts
Error: Cannot find module './signin.post' imported from routes/api/auth/signin.post.test.ts
Test Files  1 failed (1)

$ mv src/utils/cookies.ts /tmp/… && NODE_ENV=test bun --bun vitest run src/utils/cookies.test.ts
Failed to resolve import "./cookies" from "src/utils/cookies.test.ts"
Test Files  1 failed (1)

$ mv src/pages/signin.tsx /tmp/… && NODE_ENV=test bun --bun vitest run src/pages/signin.test.tsx
Failed to resolve import "./signin" from "src/pages/signin.test.tsx"
Test Files  1 failed (1)
```

Each file was `mv`'d back immediately after its red run.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  30 passed (30)
      Tests  176 passed (176)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket does add a real page and route, so it would normally want E2E coverage, but none exists to run here; `e2e/smoke.spec.ts` (home page loads, no console errors) is unaffected by an additive `/signin` route and stays green in CI.

TDD-RESULT: 176 passed, 0 failed
