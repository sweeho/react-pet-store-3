---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0009
branch: vortex/feat/SWHR3-T-0009-3-sign-on-error-state-on-the-sign-in-pag-6ccbfaab
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0009/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0009

## Test cases

| Test                                                                                                                      | Covers                | Intent                                                           |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `signin.test.tsx › shows the designed error banner above both panels with role="alert" and the exact legacy message`      | AC-1, AC-4            | banner heading + body text, `role="alert"`                       |
| `signin.test.tsx › clears the password field and keeps the user name after a failed sign-in, and does not navigate`       | AC-2                  | password cleared, username kept, password focused, no navigation |
| `signin.test.tsx › clears the banner as soon as the next submit starts, before the response arrives`                      | AC-3 (PLAN.md step 2) | banner clears synchronously on next submit, before the response  |
| `routes/api/auth/signin.post.test.ts › answers 401 and sets no session cookie on a wrong password` (existing, unmodified) | AC-5                  | no `petstore_session` cookie on a failed sign-in                 |

## Red run

`src/pages/signin.tsx` is a rewrite (SWHR3-T-0007/T-0008 already own most of it) — reset to its pre-ticket `HEAD` content and the new/extended tests in `signin.test.tsx` run against it:

```
$ # src/pages/signin.tsx reset to its pre-ticket (HEAD) content
$ NODE_ENV=test bun --bun vitest run src/pages/signin.test.tsx

FAIL › shows the designed error banner above both panels with role="alert" and the exact legacy message
  Expected element to have text content: "There were errors signing you in"
  Received: "Invalid user name or password"

FAIL › clears the password field and keeps the user name after a failed sign-in, and does not navigate
  Expected the element to have value: ""
  Received: "wrong-password"

Test Files  1 failed (1)
     Tests  2 failed | 10 passed (12)
```

(The third new test, "clears the banner as soon as the next submit starts…", passed even against the old code, since both the old minimal message and the new banner already cleared on the next submit's `setError`/`setSignInFailed(false)` — a coincidental overlap, not a gap: the two failures above are the tests that actually exercise this ticket's behavior change, and both failed as expected.)

`routes/api/auth/signin.post.test.ts` was not modified — PLAN.md step 3 only calls for adding the no-cookie-on-401 assertion "if SWHR3-T-0007 did not cover it"; it already does (`› answers 401 and sets no session cookie on a wrong password`), so no red/green cycle was needed there.

`src/pages/signin.tsx` was restored to its new content immediately after the red run.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  38 passed (38)
      Tests  226 passed (226)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket touches only `/signin`'s content (no routing/`main.tsx` change), so `e2e/smoke.spec.ts` is unaffected.

TDD-RESULT: 226 passed, 0 failed
