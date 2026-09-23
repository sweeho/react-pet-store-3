---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0022
branch: vortex/feat/SWHR3-T-0022-16-sign-on-registration-and-profile-veri-0bae9ca7
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0022/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0022: Sign-on, registration and profile verified end to end

## What changed

Added three test-only files proving the merged capability works as one journey and pinning two behaviours unit tests cannot reach: `e2e/customer-auth.spec.ts` (five real-browser journeys), `routes/api/auth/register.concurrency.test.ts` (real concurrent duplicate registration), and `routes/api/session.timeout.test.ts` (idle timeout through the real chained handlers). No production code changed — this ticket is test-only by design (Testing & Integration).

## Files

- `e2e/customer-auth.spec.ts` — full registration→profile→sign-out→sign-in-with-remember→prefill journey; protected-page redirect and return; wrong-password and duplicate-username error states; a `page.route`-forced 500 on `/api/customers/me` rendering the error screen.
- `routes/api/auth/register.concurrency.test.ts` — two `register.post.ts` handler calls run through `Promise.allSettled`, asserting exactly one 201, one 409 `DUPLICATE_ACCOUNT`, and one row in `accounts`.
- `routes/api/session.timeout.test.ts` — signs in through `signin.post.ts`, advances 31 minutes with `vi.setSystemTime`, and asserts `customers/me.get.ts` answers 401 "Session timed out" (plus a negative case at +29 minutes, which still answers 404 since no profile exists — proof the session itself is what's under test).

## AC coverage

- AC-1 (register → create-customer form → profile with values shown → sign out → sign in with Remember checked → prefilled next visit) — `customer-auth.spec.ts`'s first test, a single continuous journey.
- AC-2 (signed-out `/users/profile` → `/signin?redirect=...` → back on `/users/profile` after sign-in) — `customer-auth.spec.ts`'s second test.
- AC-3 (wrong password → sign-on error message; duplicate user name → "That user name is already taken") — `customer-auth.spec.ts`'s third and fourth tests.
- AC-4 (failed profile load → error screen) — `customer-auth.spec.ts`'s fifth test, intercepting `/api/customers/me` with `page.route`.
- AC-5 (concurrent duplicate registration: one 201, one 409, one row) — `register.concurrency.test.ts`.
- AC-6 (idle timeout → 401 "Session timed out" on `GET /api/customers/me`) — `session.timeout.test.ts`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run routes/api/auth/register.concurrency.test.ts routes/api/session.timeout.test.ts
Test Files  2 passed (2)
     Tests  3 passed (3)
(run 4× total to rule out flakiness — identical every time)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  46 passed (46)
     Tests  268 passed (268)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`.
```

See `tdd-test-result.md` — `TDD-RESULT: 268 passed, 0 failed`.

## Notes

- **`e2e/customer-auth.spec.ts` was never executed in this container** (no Chromium — same limitation as every prior ticket, but this time it's this ticket's own primary deliverable, not incidental). It was verified as thoroughly as possible without a browser: `tsc --build` type-checks it clean, `eslint` passes, and every selector was hand-checked against the real JSX of `signin.tsx`, `users/create.tsx`, `users/profile.tsx` and `RootErrorBoundary.tsx`. That review caught two real bugs before the first push: Playwright's `getByLabel`/`getByText` substring-match by default (unlike Testing Library), so `getByLabel("Password")` inside the New customer panel would also match "Confirm password", and `getByLabel("Street address")` would also match "Street address line 2 (optional)". The first CI run still came back red: it caught a **third** instance of the same bug — `getByLabel("User name")` also matched the "Remember my user name" checkbox (substring), failing 3 of 8 tests. Fixed the same way and re-pushed. All three now use `{ exact: true }`. This is the clearest proof point in this ticket that CI running a real Chromium is the actual gate for this file, not local reasoning — see `tdd-test-result.md` for the failing CI log detail.
- Neither `register.concurrency.test.ts` nor `session.timeout.test.ts` has a traditional red→green pair: both exercise already-merged code this ticket doesn't own (`lib/accounts.ts`, `lib/session.ts`, `routes/api/customers/me.get.ts`), and this ticket's file ownership is exactly the three test files — reverting an unowned file, even temporarily, was judged out of scope. See `tdd-test-result.md`'s Red run section for the full reasoning and the flakiness-ruling-out repeat runs used instead.
- No production defect was found in the merged code while writing these tests, so no DEFECT ticket was raised (PLAN.md's note on fixing contained defects in-place didn't apply — there was nothing to fix).
