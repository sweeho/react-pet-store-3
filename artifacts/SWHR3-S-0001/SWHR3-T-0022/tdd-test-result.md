---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0022
branch: vortex/feat/SWHR3-T-0022-16-sign-on-registration-and-profile-veri-0bae9ca7
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0022/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0022

## Test cases

| Test                                                                                                                                             | Covers               | Intent                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register.concurrency.test.ts › two simultaneous registrations for the same user name: one 201, one 409 DUPLICATE_ACCOUNT, one account row`      | AC-5                 | real concurrent `Promise.allSettled` over two `register.post.ts` calls; exactly one fulfilled, one rejected 409, one row in `accounts`                |
| `session.timeout.test.ts › answers 401 'Session timed out' once 30 idle minutes have passed since sign-in`                                       | AC-6                 | sign in through the real `signin.post.ts` handler, advance 31 minutes, `customers/me.get.ts` answers 401                                              |
| `session.timeout.test.ts › stays active and answers normally (not 401) inside the 30-minute window`                                              | AC-6 (negative case) | at +29 minutes the same chain answers 404 (no profile yet), not 401 — proves the session, not the profile lookup, is what timed out in the first test |
| `e2e/customer-auth.spec.ts › register, complete the profile, sign out, sign back in with Remember my user name, and find it prefilled next time` | AC-1                 | full happy-path journey in a real browser                                                                                                             |
| `e2e/customer-auth.spec.ts › a signed-out visit to /users/profile redirects to /signin and returns there after signing in`                       | AC-2                 | protected-page redirect + return                                                                                                                      |
| `e2e/customer-auth.spec.ts › a wrong password shows the exact sign-on error message`                                                             | AC-3                 | sign-on error banner text                                                                                                                             |
| `e2e/customer-auth.spec.ts › a duplicate user name shows the taken-user-name message`                                                            | AC-3                 | registration duplicate banner                                                                                                                         |
| `e2e/customer-auth.spec.ts › a failed profile load renders the error screen`                                                                     | AC-4                 | `page.route` 500 on `/api/customers/me` → error screen heading                                                                                        |

## Red run

**`register.concurrency.test.ts` and `session.timeout.test.ts`** exercise already-merged code this ticket does not own (`lib/accounts.ts`'s `createAccount` — SWHR3-T-0017; `lib/session.ts`'s `requireSessionUser` and `routes/api/customers/me.get.ts` — SWHR3-T-0010/SWHR3-T-0015). This ticket's file ownership is exactly the three test files, so there is no owned source file to revert for a traditional red proof, and touching `lib/accounts.ts` / `lib/session.ts` / `routes/api/customers/me.get.ts` even temporarily would exceed it. Per the TDD-result skill's "genuinely unobtainable" allowance:

- The underlying mechanisms are already unit-tested in isolation: `lib/accounts.test.ts › throws DuplicateAccountError on a duplicate user name` (sequential, not concurrent) and `lib/session.test.ts › requireSessionUser … throws a 401 'Session timed out' when the session has expired` (direct `lib/session.ts` call, not through the route handlers).
- What these two new tests add is coverage those unit tests structurally cannot give: `register.concurrency.test.ts` fires two `register.post.ts` handler calls through `Promise.allSettled` so both `hashPassword` calls and both inserts genuinely interleave, rather than running one full request to completion before the next starts; `session.timeout.test.ts` chains the real `signin.post.ts` and `customers/me.get.ts` handlers, rather than calling `lib/session.ts` directly.
- Each test was run **four times in a row** (the initial run plus three shown below) to rule out order-dependent flakiness, since there is no failing-then-passing pair to show:

```
$ for i in 1 2 3; do NODE_ENV=test bun --bun vitest run routes/api/auth/register.concurrency.test.ts; done
Test Files  1 passed (1)   Tests  1 passed (1)   (×3, identical)

$ for i in 1 2 3; do NODE_ENV=test bun --bun vitest run routes/api/session.timeout.test.ts; done
Test Files  1 passed (1)   Tests  2 passed (2)   (×3, identical)
```

**`e2e/customer-auth.spec.ts`** could not be executed at all in this container: `node scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed (same limitation every ticket in this sprint has hit — see AGENTS.md: E2E runs in the QA phase / CI, not in an engineer container). There is therefore no red _or_ green run to report for this file from local execution. What was verified locally:

- `bun run verify`'s `tsc --build` step type-checks `e2e/**` (per `tsconfig.node.json`) and passed with no errors — every Playwright API call and every page-object shape resolves.
- `bun run lint` passed with 0 warnings on the file.
- Every selector was cross-checked by hand against the actual rendered JSX of `src/pages/signin.tsx`, `src/pages/users/create.tsx`, `src/pages/users/profile.tsx` and `src/pages/RootErrorBoundary.tsx` (all read in full during this ticket) — including two real ambiguity bugs caught and fixed before any run: Playwright's `getByLabel`/`getByText` do case-insensitive **substring** matching by default (unlike Testing Library's exact-by-default), so `getByLabel("Password")` inside the New customer panel would also match "Confirm password", and `getByLabel("Street address")` would also match "Street address line 2 (optional)" — both now pass `{ exact: true }`.
- CI (`.github/workflows/ci.yml`) runs the full Playwright suite in a Chromium-equipped runner; `a2a_await_ci` is the real verification for this file, and Validation's INTEGRATION_QA phase is the fallback if CI's environment still can't run it.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  46 passed (46)
      Tests  268 passed (268)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container and instructed falling back to `verify` rather than installing a browser here. Unlike every prior ticket this sprint, this ticket's own primary deliverable is an E2E spec, so this gap is called out explicitly rather than treated as routine — see Red run above and Notes in summary.md.

TDD-RESULT: 268 passed, 0 failed
