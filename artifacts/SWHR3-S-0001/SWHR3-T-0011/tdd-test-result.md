---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0011
branch: vortex/feat/SWHR3-T-0011-5-protected-api-paths-and-pages-with-ret-ef0630f1
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0011/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0011

## Test cases

| Test                                                                                                                             | Covers           | Intent                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------- |
| `lib/protected-resources.test.ts › lists exactly /api/customers and /api/customers/me`                                           | AC-5, AC-6       | contract's exact path list                  |
| `lib/protected-resources.test.ts › is frozen`                                                                                    | AC-5             | cached in memory, immutable                 |
| `lib/protected-resources.test.ts › matches a protected path exactly`                                                             | AC-2, AC-6       | exact-match positive case                   |
| `lib/protected-resources.test.ts › does not match a path that merely starts with a protected prefix`                             | AC-2             | exact match, not prefix                     |
| `lib/protected-resources.test.ts › does not match an unrelated or unprotected path`                                              | AC-2, AC-9       | `/api/hello` stays unprotected              |
| `middleware/auth.test.ts › sets event.context.user/locale for an active session, on a protected path`                            | AC-6             | active session populates context            |
| `middleware/auth.test.ts › throws 401 'Authentication required' on a protected path with no session`                             | AC-1, AC-6, AC-7 | none → 401 "Authentication required"        |
| `middleware/auth.test.ts › throws 401 'Session timed out' on a protected path with an expired session`                           | AC-4, AC-7       | expired → 401 "Session timed out"           |
| `middleware/auth.test.ts › does not throw on a non-protected path with no session, and leaves context.user undefined`            | AC-9             | non-protected never 401s                    |
| `middleware/auth.test.ts › still attaches context.user on a non-protected path when a session is active`                         | AC-6             | context populated regardless of protection  |
| `routes/api/hello.test.ts › greets "guest" when there is no session`                                                             | AC-9             | `/api/hello` signed-out                     |
| `routes/api/hello.test.ts › greets the signed-in user by user name when there is an active session`                              | AC-9             | `/api/hello` signed-in                      |
| `routes/api/hello.test.ts › answers "guest" even without the middleware running first (no throw)`                                | AC-9             | never throws                                |
| `src/hooks/use-session.test.tsx › starts loading, then resolves to the signed-in user`                                           | AC-6             | `useSession` happy path                     |
| `src/hooks/use-session.test.tsx › resolves to a null user and expired:true when the session has timed out`                       | AC-4             | `useSession` expired case                   |
| `src/hooks/use-session.test.tsx › resolves to a signed-out state when the request itself fails`                                  | —                | defensive fallback                          |
| `src/hooks/use-session.test.tsx › calls GET /api/session`                                                                        | AC-6             | fetch target                                |
| `src/components/auth/require-auth.test.tsx › renders the Suspense-matching fallback while the session check is loading`          | —                | loading state matches `<Suspense fallback>` |
| `src/components/auth/require-auth.test.tsx › redirects a signed-out visitor away from a protected path, with redirect set to it` | AC-1, AC-3, AC-8 | redirect on protected + signed-out          |
| `src/components/auth/require-auth.test.tsx › renders the protected page for a signed-in visitor`                                 | AC-6             | no redirect when signed in                  |
| `src/components/auth/require-auth.test.tsx › renders a non-protected path for a signed-out visitor, no redirect`                 | —                | non-protected page unaffected               |
| `src/components/auth/require-auth.test.tsx › carries the visited path and query into the redirect query parameter`               | AC-3, AC-8       | `redirect=%2Fusers%2Fprofile%3Ftab%3Dcards` |

## Red run

New files were run against their missing module (genuine "cannot find module"); the two rewritten files (`middleware/auth.ts`, `routes/api/hello.ts`) were temporarily reset to their pre-ticket content (via `git show HEAD:<path>`) and their new tests run against that old behaviour:

```
$ NODE_ENV=test bun --bun vitest run lib/protected-resources.test.ts
Error: Cannot find module './protected-resources' imported from lib/protected-resources.test.ts
Test Files  1 failed (1)

$ # middleware/auth.ts and routes/api/hello.ts reset to their pre-ticket (HEAD) content
$ NODE_ENV=test bun --bun vitest run middleware/auth.test.ts routes/api/hello.test.ts
FAIL middleware/auth.test.ts > still attaches context.user on a non-protected path…
  - { "id": 7, "username": "jgarrett" }
  + { "name": "Yeasin" }
FAIL routes/api/hello.test.ts > greets "guest" when there is no session
  - "Hello guest"
  + "Hello Yeasin"
FAIL routes/api/hello.test.ts > answers "guest" even without the middleware running first (no throw)
  TypeError: Cannot destructure property 'name' from null or undefined value
Test Files  2 failed (2)
     Tests  8 failed (8)
```

Both files were restored to their new content immediately after.

`src/hooks/use-session.ts` and `src/components/auth/require-auth.tsx` were each moved aside and their own test file run in isolation, confirming a genuine "Cannot find module" failure, then restored:

```
$ mv src/hooks/use-session.ts /tmp/… && NODE_ENV=test bun --bun vitest run src/hooks/use-session.test.tsx
Failed to resolve import "./use-session" from "src/hooks/use-session.test.tsx"
Test Files  1 failed (1)

$ mv src/components/auth/require-auth.tsx /tmp/… && NODE_ENV=test bun --bun vitest run src/components/auth/require-auth.test.tsx
Failed to resolve import "./require-auth" from "src/components/auth/require-auth.test.tsx"
Test Files  1 failed (1)
```

`src/constants/protected-pages.ts` has no dedicated test file (it is a plain constant array, per file ownership) — it is exercised indirectly through `require-auth.test.tsx`'s protected/non-protected assertions above, which fail without it (verified by the same `require-auth.tsx` red run, since importing it transitively imports `protected-pages.ts`). `src/main.tsx`'s guard wrapper has no dedicated unit test either — it is one line of composition (`<RequireAuth>{useRoutes(routes)}</RequireAuth>`) validated by `require-auth.test.tsx`'s coverage of `RequireAuth` itself, plus `e2e/smoke.spec.ts` in CI/QA.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  35 passed (35)
      Tests  207 passed (207)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket wires a guard into `src/main.tsx`, so `e2e/smoke.spec.ts` matters here: by inspection, `/` is not in `PROTECTED_PAGE_PATHS`, `GET /api/session` never 401s (C9), and `/api/hello` is deliberately unprotected, so the smoke spec's page-load and `/api/hello` checks are expected to stay green — but this was not executed against a real browser in this container; Validation runs it in the QA phase.

TDD-RESULT: 207 passed, 0 failed
