---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0017
branch: vortex/feat/SWHR3-T-0017-11-account-storage-and-credential-servic-4a596ffa
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0017/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0017

## Test cases

| Test                                                                                                | Covers     | Intent                                                       |
| --------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `lib/password.test.ts › never returns the plain password as the hash`                               | AC-3       | hashPassword never equals plain text                         |
| `lib/password.test.ts › produces an argon2id hash`                                                  | AC-2       | `Bun.password.hash` uses argon2id                            |
| `lib/password.test.ts › produces a different hash for the same password across calls`               | AC-3       | salted, not a lookup table                                   |
| `lib/password.test.ts › accepts the right password against its own hash`                            | AC-3       | verifyPassword true case                                     |
| `lib/password.test.ts › rejects a wrong password`                                                   | AC-3       | verifyPassword false case                                    |
| `lib/accounts.test.ts › stores a passwordHash that never equals the plain password`                 | AC-3       | createAccount never stores plaintext                         |
| `lib/accounts.test.ts › rejects a user name that breaks the auth-config rules with ValidationError` | AC-4       | createAccount validates username                             |
| `lib/accounts.test.ts › rejects a password that breaks the auth-config rules with ValidationError`  | AC-4       | createAccount validates password                             |
| `lib/accounts.test.ts › reports invalid fields by name in fieldErrors`                              | AC-4       | fieldErrors keyed by field                                   |
| `lib/accounts.test.ts › throws DuplicateAccountError on a duplicate user name`                      | AC-1, AC-2 | unique-constraint violation wrapped as DuplicateAccountError |
| `lib/accounts.test.ts › returns the account for the right password`                                 | AC-3       | verifyCredentials success                                    |
| `lib/accounts.test.ts › returns null for a wrong password`                                          | AC-3       | verifyCredentials wrong password                             |
| `lib/accounts.test.ts › returns null for an unknown user name`                                      | AC-3       | verifyCredentials unknown user                               |
| `lib/accounts.test.ts › updates the stored hash on a correct current password`                      | AC-2       | changePassword success path                                  |
| `lib/accounts.test.ts › throws and leaves the stored hash unchanged on a wrong current password`    | AC-5       | changePassword failure leaves hash intact                    |
| `lib/accounts.test.ts › rejects a new password that breaks the auth-config rules`                   | AC-4       | changePassword validates the new password                    |

## Red run

`NODE_ENV=test bun --bun vitest run lib/password.test.ts lib/accounts.test.ts` — before `lib/password.ts`/`lib/accounts.ts` existed:

```
FAIL  |server| lib/password.test.ts [ lib/password.test.ts ]
Error: Cannot find module './password' imported from /workspace/repo/lib/password.test.ts

FAIL  |server| lib/accounts.test.ts [ lib/accounts.test.ts ]
Error: Cannot find module './accounts' imported from /workspace/repo/lib/accounts.test.ts

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  21 passed (21)
      Tests  135 passed (135)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket is a backend service module with no route wiring or UI change, so it owes no E2E coverage.

TDD-RESULT: 135 passed, 0 failed
