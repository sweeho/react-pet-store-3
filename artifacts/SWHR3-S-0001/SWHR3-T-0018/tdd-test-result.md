---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0018
branch: vortex/feat/SWHR3-T-0018-12-transaction-helper-for-multi-step-wri-998086f3
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0018/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0018

## Test cases

| Test                                                                                                      | Covers | Intent                                                                |
| --------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `lib/transaction.test.ts › commits a standalone write, making it visible afterwards`                      | AC-1   | no `outer` → `withTransaction` auto-creates and commits a transaction |
| `lib/transaction.test.ts › rolls back a standalone write when fn throws, leaving no row`                  | AC-4   | a throw inside `fn` leaves no write visible                           |
| `lib/transaction.test.ts › joins an outer transaction instead of starting a second one`                   | AC-2   | given `outer`, `fn` runs against it, no separate commit               |
| `lib/transaction.test.ts › rolling back the outer transaction removes writes made by a joined inner call` | AC-5   | outer throw rolls back both the outer and the joined inner write      |

## Red run

`NODE_ENV=test bun --bun vitest run lib/transaction.test.ts` — against `lib/transaction.ts` stubbed to `throw new Error("not implemented")` (verifying the tests actually exercise the behaviour, not just presence of the module):

```
 FAIL  |server| lib/transaction.test.ts > withTransaction > commits a standalone write, making it visible afterwards (AC-1)
 FAIL  |server| lib/transaction.test.ts > withTransaction > rolls back a standalone write when fn throws, leaving no row
 FAIL  |server| lib/transaction.test.ts > withTransaction > joins an outer transaction instead of starting a second one (AC-2)
 FAIL  |server| lib/transaction.test.ts > withTransaction > rolling back the outer transaction removes writes made by a joined inner call
Error: not implemented

 Test Files  1 failed (1)
      Tests  4 failed (4)
```

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`), with the real `lib/transaction.ts` implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  22 passed (22)
      Tests  139 passed (139)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket is a backend helper with no route wiring or UI change, so it owes no E2E coverage.

TDD-RESULT: 139 passed, 0 failed
