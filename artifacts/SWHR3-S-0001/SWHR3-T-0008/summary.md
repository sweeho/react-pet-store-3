---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0008
branch: vortex/feat/SWHR3-T-0008-2-new-customer-registration-panel-and-re-1c135fc3
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0008/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0008: New-customer registration panel and register API

## What changed

Added `POST /api/auth/register` (design.md C12): validates `j_username`/`j_password`/`j_password_confirm` with `lib/validation.ts` (C3), keyed by parameter name; calls `createAccount` (C6), which throws `DuplicateAccountError` on a taken name; starts a session (C8) and answers 201 `{ user }` on success. Filled in the New customer panel on `src/pages/signin.tsx` (previously a "Coming soon" placeholder from T-0007): user name / password / confirm-password fields and a "Create new account" button, matching `mockup-sign-on.html`. Client-side checks the password confirmation before sending anything; a 409 renders the duplicate-user-name `Alert` from `mockup-registration-error.html` and keeps the typed user name; a 422 shows each field error under its field; success navigates to `/users/create`.

## Files

- `routes/api/auth/register.post.ts` — the register handler.
- `routes/api/auth/register.post.test.ts` — 5 integration tests (201 + session, 409, three 422 cases).
- `src/pages/signin.tsx` — New customer panel filled in; one `aria-label="Returning customer"` added to the pre-existing Returning customer `<section>` (see Notes).
- `src/pages/signin.test.tsx` — 4 new registration-panel tests; 6 pre-existing (T-0007) tests rescoped to query through their panel's region instead of a bare `getByLabelText` (see Notes).
- `artifacts/SWHR3-S-0001/SWHR3-T-0008/{PLAN.md,tdd-test-result.md,summary.md}` — deviation note + required artifacts.

## AC coverage

- AC-1 (screen shows username/password/confirm-password inputs and a create-account button) — `signin.test.tsx › renders the registration fields, a Confirm password field, and a Create new account button`.
- AC-2 (form submits via POST to the registration handler — SD-mapped from `createuser.do` to `POST /api/auth/register`, design.md "Spec discrepancies") — `signin.test.tsx › submits j_username/j_password/j_password_confirm…` asserts the POST URL and body shape.
- AC-3 (valid new user is registered, identity created, success returned) — `register.post.test.ts › answers 201…` and `› answers 409 DUPLICATE_ACCOUNT for a taken user name`.
- AC-4 (interface contract: request/response shapes, 201/409/422, `fieldErrors` keyed by parameter name) — the 5 `register.post.test.ts` cases plus `signin.test.tsx`'s submit test.
- AC-5 (browser on `/users/create` after success) — `signin.test.tsx › submits…` asserts navigation to the create-customer route.
- AC-6 (duplicate user name shows "That user name is already taken" heading and keeps the entered name) — `signin.test.tsx › shows "That user name is already taken"…`.
- AC-7 (mismatched confirmation reported on the confirmation field, no request sent) — `signin.test.tsx › reports a password/confirmation mismatch…`, asserting the mocked `fetch` was never called.

## Verification

```
$ NODE_ENV=test bun --bun vitest run routes/api/auth/register.post.test.ts src/pages/signin.test.tsx
Test Files  2 passed (2)
     Tests  15 passed (15)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  32 passed (32)
     Tests  196 passed (196)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 196 passed, 0 failed`. Red phase confirmed separately: the route stubbed to throw (5/5 failed), and the page tested against the pre-ticket `signin.tsx` from git `HEAD` (10/10 failed, including the 6 pre-existing tests — see Notes) — then both restored.

## Notes

- **Deviation:** the mockup gives the New customer panel the same field labels as the Returning customer panel ("User name", "Password"), which makes a bare `getByLabelText("User name")` ambiguous the moment the New customer panel has real inputs. Added one `aria-label="Returning customer"` to the pre-existing Returning customer `<section>` (mirroring the `aria-label="New customer"` T-0007 already put on the other section) and rescoped `signin.test.tsx`'s 6 pre-existing queries through `within(getByRole("region", { name }))`. No Returning-customer copy or behavior changed. Recorded on `PLAN.md` per the minor-deviation protocol; required by the ticket's own "existing test suites … stay green" Definition-of-Done item.
- `routes/api/auth/register.post.ts` validates with the same `lib/validation.ts` functions `createAccount` uses internally, so `createAccount`'s own internal `ValidationError` (keyed `username`/`password`, not the parameter-name keys the interface contract requires) is never reached in practice — the route's own pre-validation always catches a rule violation first.
- Followed `mockup-sign-on.html` for the panel layout/copy and `mockup-registration-error.html` for the duplicate-name `Alert`'s exact heading and body wording (interpolating the submitted user name).
- Password fields use `autoComplete="new-password"` (vs. the Returning customer panel's `current-password`), matching standard browser autofill semantics for an account-creation form.
