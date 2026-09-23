---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0020
branch: vortex/feat/SWHR3-T-0020-14-auth-configuration-and-the-lib-server-b959446e
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0020/PLAN.md]
---

# TDD result — SWHR3-T-0020

## Test cases

| Test                                                                                                                           | Covers     | Intent                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------- |
| `lib/auth-config.test.ts › AUTH_CONFIG › configures form-based auth with the sign-in and error pages`                          | AC-1, AC-2 | `authMethod`, `signInPage`, `signInErrorPage` are set per C1                |
| `lib/auth-config.test.ts › AUTH_CONFIG › configures the session cookie, timeout, remember cookie and locale`                   | AC-2       | cookie name, 1800s timeout, `bp_signon`, one-year max age, `en_US`          |
| `lib/auth-config.test.ts › AUTH_CONFIG › configures username and password length and pattern rules`                            | AC-2       | username 3-25 `[A-Za-z0-9]`, password 8-64                                  |
| `lib/auth-config.test.ts › AUTH_CONFIG › mirrors the client-safe values in src/constants/auth.ts`                              | AC-2       | `src/constants/auth.ts` values equal the corresponding `AUTH_CONFIG` fields |
| `lib/auth-config.test.ts › getSessionSecret › returns SESSION_SECRET when it is set`                                           | AC-3       | env var takes precedence                                                    |
| `lib/auth-config.test.ts › getSessionSecret › returns a fixed development secret of at least 32 characters outside production` | AC-3       | unset + non-production branch                                               |
| `lib/auth-config.test.ts › getSessionSecret › throws in production when SESSION_SECRET is unset`                               | AC-3       | unset + production branch throws                                            |

AC-4 (lib/ type-checked under `tsconfig.node.json`, `*.test.ts` runs in the server Vitest project) and
AC-5 (`.env.example` + `doc/DEPLOYMENT.md`) are structural/config changes verified by the green run
below rather than by a dedicated test case.

## Red run

`NODE_ENV=test bun --bun vitest run lib/auth-config.test.ts`, before `lib/auth-config.ts` and
`src/constants/auth.ts` existed:

```
FAIL  |server| lib/auth-config.test.ts [ lib/auth-config.test.ts ]
Error: Cannot find module './auth-config' imported from /workspace/repo/lib/auth-config.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  8 passed (8)
      Tests  27 passed (27)
```

`bun run verify:full`'s browser tier (`test:e2e`) could not run: the preflight
(`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in this container
(`/ms-playwright/chromium-1155/chrome-linux/chrome` missing). Per AGENTS.md this is the documented
fallback case — E2E runs in the QA phase / CI, not here — so `verify` is the gate of record for this
run; not retried, no browser install attempted.

TDD-RESULT: 27 passed, 0 failed
