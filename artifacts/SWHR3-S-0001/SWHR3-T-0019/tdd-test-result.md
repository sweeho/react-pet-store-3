---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0019
branch: vortex/feat/SWHR3-T-0019-13-app-error-screen-and-exception-to-scr-e1429816
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0019/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0019

## Test cases

| Test                                                                                                                 | Covers     | Intent                                              |
| -------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| `src/utils/error-screen.test.ts › maps a 401 ApiError to the signin screen`                                          | AC-6       | 401 → `signin`                                      |
| `src/utils/error-screen.test.ts › maps a 409 DUPLICATE_ACCOUNT ApiError to the friendly message on the error screen` | AC-6       | 409/`DUPLICATE_ACCOUNT` → friendly message          |
| `src/utils/error-screen.test.ts › maps any other ApiError to the error screen with its own message`                  | AC-6       | default case, own message                           |
| `src/utils/error-screen.test.ts › maps a plain Error to the error screen with its message`                           | AC-6       | non-`ApiError` `Error`                              |
| `src/utils/error-screen.test.ts › maps a non-Error thrown value to the error screen with a generic message`          | AC-6       | non-`Error` thrown value                            |
| `src/components/error-boundary.test.tsx › shows the error screen instead of a blank page when a child throws`        | AC-3, AC-4 | render error → designed error screen, no blank page |
| `src/components/error-boundary.test.tsx › logs the caught error to the console exactly once`                         | AC-5       | single `console.error` call                         |
| `src/components/error-boundary.test.tsx › renders its children normally when nothing throws`                         | —          | no false positive                                   |

## Red run

`src/utils/error-screen.ts` and `src/components/error-boundary.tsx` are new files, moved aside and their tests run in isolation to confirm a genuine "cannot resolve module" failure, then restored. `src/pages/RootErrorBoundary.tsx` is a rewrite — reset to its pre-ticket `HEAD` content and `error-boundary.test.tsx` run against it, then restored:

```
$ mv src/utils/error-screen.ts /tmp/… && NODE_ENV=test bun --bun vitest run src/utils/error-screen.test.ts
Failed to resolve import "./error-screen" from "src/utils/error-screen.test.ts"
Test Files  1 failed (1)

$ mv src/components/error-boundary.tsx /tmp/… && NODE_ENV=test bun --bun vitest run src/components/error-boundary.test.tsx
Failed to resolve import "./error-boundary" from "src/components/error-boundary.test.tsx"
Test Files  1 failed (1)

$ # src/pages/RootErrorBoundary.tsx reset to its pre-ticket (HEAD) content ("Error" / "An error occurred...")
$ NODE_ENV=test bun --bun vitest run src/components/error-boundary.test.tsx
FAIL › shows the error screen instead of a blank page when a child throws
  Unable to find role="heading" ... Name "Something went wrong"
  (rendered heading was "Error", body was "An error occurred. Please try again later.")
Test Files  1 failed (1)
     Tests  1 failed | 2 passed (3)
```

Each file was restored to its new content immediately after its red run.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  38 passed (38)
      Tests  224 passed (224)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket changes `src/main.tsx` (wraps the guarded routes in `AppErrorBoundary`, adds `onCaughtError` to `createRoot`), so `e2e/smoke.spec.ts` is relevant here: the happy path (home page loads, no console errors) never triggers the error boundary or `onCaughtError`, so it is expected to stay unaffected — not executed against a real browser in this container.

TDD-RESULT: 224 passed, 0 failed
