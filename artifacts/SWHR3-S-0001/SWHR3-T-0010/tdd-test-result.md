---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0010
branch: vortex/feat/SWHR3-T-0010-4-session-lifecycle-30-minute-idle-timeo-1c716de0
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0010/PLAN.md]
---

# TDD result — SWHR3-T-0010

## Test cases

| Test                                                                                                           | Covers     | Intent                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `lib/session.test.ts › creates a session carrying the account, and defaults the locale to en_US`               | AC-1, AC-3 | `startSession` + `readSession` round trip returns the account and `en_US`                    |
| `lib/session.test.ts › reads as none when there is no cookie at all`                                           | AC-1       | never-signed-in distinguishable from expired                                                 |
| `lib/session.test.ts › reads as expired when the cookie is present but cannot be unsealed`                     | AC-2       | corrupt/foreign cookie reads as expired, per D2                                              |
| `lib/session.test.ts › stays active and restarts its idle window when read 29 minutes after the last activity` | AC-6       | sliding timeout: two consecutive 29-minute gaps, 58 minutes since creation, still active     |
| `lib/session.test.ts › reads as expired 31 minutes after the last activity`                                    | AC-2, AC-6 | idle timeout fires past 1800s                                                                |
| `lib/session.test.ts › endSession › clears the session so the next request reads as none`                      | AC-4       | sign-out invalidates the session                                                             |
| `lib/session.test.ts › requireSessionUser › returns the user for an active session`                            | AC-1       | happy path                                                                                   |
| `lib/session.test.ts › requireSessionUser › throws a 401 'Authentication required' when there is no session`   | AC-2       | D7 message for `none`                                                                        |
| `lib/session.test.ts › requireSessionUser › throws a 401 'Session timed out' when the session has expired`     | AC-2       | D7 message for `expired`                                                                     |
| `routes/api/session.get.test.ts` (3 cases)                                                                     | AC-5       | `GET /api/session` answers `{ user, locale, expired }` for active/none/expired, never throws |
| `routes/api/auth/signout.post.test.ts` (2 cases)                                                               | AC-4, AC-5 | `POST /api/auth/signout` answers 204 and clears the session                                  |
| `src/components/auth/sign-out-button.test.tsx` (2 cases)                                                       | AC-7       | posts to `/api/auth/signout`, then navigates to `/signin`, even if the request fails         |

## Red run

`NODE_ENV=test bun --bun vitest run lib/session.test.ts`, before `lib/session.ts` existed:

```
FAIL |server| lib/session.test.ts [ lib/session.test.ts ]
Error: Cannot find module './session' imported from /workspace/repo/lib/session.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

`NODE_ENV=test bun --bun vitest run routes/api/session.get.test.ts routes/api/auth/signout.post.test.ts src/components/auth/sign-out-button.test.tsx`, before the three source files existed:

```
FAIL |server| routes/api/session.get.test.ts — Cannot find module './session.get'
FAIL |server| routes/api/auth/signout.post.test.ts — Cannot find module './signout.post'
FAIL |client| src/components/auth/sign-out-button.test.tsx — Failed to resolve import "./sign-out-button"
Test Files  3 failed (3)
     Tests  no tests
```

One intermediate red, caught before the final green: `SignOutButton`'s first draft only wrapped the `apiFetch` call in `try/finally`, so a failed request (the second component test) rejected `handleSignOut`'s promise with nothing to catch it — Vitest reported an unhandled rejection even though the test's assertions passed. Fixed by adding an explicit `catch` that swallows the error (sign-out always proceeds to `/signin` regardless of the request outcome).

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  25 passed (25)
      Tests  151 passed (151)
```

`bun run verify:full`'s E2E tier could not run: the preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed in this container — same documented AGENTS.md fallback as the
prior tickets in this sprint. `verify` is the gate of record.

TDD-RESULT: 151 passed, 0 failed
