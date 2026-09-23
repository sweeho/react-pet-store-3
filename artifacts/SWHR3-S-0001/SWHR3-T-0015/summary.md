---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0015
branch: vortex/feat/SWHR3-T-0015-9-customer-profile-service-api-and-accou-cb437870
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0015/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0015: Customer profile service, API and account profile page

## What changed

Added `lib/customers.ts` (C15): `createCustomer`/`updateCustomer` each run their customer + card write
in one `withTransaction` (C7); `getCustomerProfile` joins accounts/customers/creditCards; `deleteCustomer`
removes the row (the card cascades). Added the three `/api/customers` routes, each starting with
`requireSessionUser` and ending in `toHttpError`. Replaced the static `/users/profile` placeholder with
the real page from `mockup-account-profile.html`'s body (the storefront topbar/catnav/footer shell is
out of scope per `MANIFEST.md`): read-only user name, editable contact/card/profile sections, Cancel,
Save changes, and the `SignOutButton` (SWHR3-T-0010).

## Files

- `lib/customers.ts` — `createCustomer`, `getCustomerProfile`, `updateCustomer`, `deleteCustomer`.
- `lib/customers.test.ts` — 14 cases (create/get/update/delete, duplicate-email, profile-exists,
  card-kept-vs-replaced, and a forced-failure rollback test — see Notes).
- `routes/api/customers/index.post.ts`, `me.get.ts`, `me.put.ts` (+ one test file each, 13 cases total).
- `src/pages/users/profile.tsx` — the real profile page, replacing the static placeholder.
- `src/pages/users/profile.test.tsx` — 6 cases.

## AC coverage

- AC-1 — profile retrieval with every stored field: `getCustomerProfile` (`lib/customers.test.ts ›
getCustomerProfile`), `GET /api/customers/me` (`me.get.test.ts`).
- AC-2 — persists every modification: `updateCustomer` tests; duplicate-email on create/update creates
  or changes nothing (asserted via a `getCustomerProfile`/re-read check in each case).
- AC-3 — interface contract: exports match C15 exactly; route status codes (401/201/200/404) pinned by
  the route test files.
- AC-4 — 409 `DUPLICATE_EMAIL` (create and update) and 409 `PROFILE_EXISTS` (second create): the
  duplicate-email/profile-exists cases in `lib/customers.test.ts` and the 409 cases in the route tests.
- AC-5 — interface contract (repeated criterion index in the ticket): same coverage as AC-3/AC-4.
- AC-6 — `/users/profile` matches the mockup's sections and states:
  `profile.test.tsx › shows the user name read-only and the card masked...`, `› edits and saves changes,
which persist across a reload`, `› resets the form... when Cancel is clicked`, `› shows a Sign out
control`.
- AC-7 — `profile.test.tsx › navigates to /users/create when the account has no profile (404)` and
  `› throws any other load failure to the app error boundary`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/customers.test.ts   # red, before lib/customers.ts existed
Cannot find module './customers'
$ bun run verify                                               # green, after implementation
Test Files  33 passed (33)
     Tests  204 passed (204)
```

`bun run verify:full`'s E2E tier could not run — Chromium is not installed in this container
(documented AGENTS.md fallback, same as every prior ticket this sprint). See `tdd-test-result.md` for
the full red/green detail, including the profile page's initial 6-failure red run against the old
static placeholder.

## Notes

- The "rollback when the card insert fails" test needs a genuine card-insert failure, but
  `parseCustomerProfileInput` fully validates every card field before any insert is attempted, so that
  failure is unreachable through `createCustomer`'s own public inputs. The test patches
  `BaseSQLiteDatabase.prototype.insert` (the method `SQLiteTransaction` inherits, so it is shared by
  both `db` and any `tx` created from it) to force the credit-card insert to throw, then asserts no
  customer row survives. Verified empirically first (a throwaway script) that patching the instance-level
  `db.insert` does NOT intercept `tx.insert` — they're separate objects sharing the same prototype
  method — before settling on the prototype-level patch.
- The profile page fetches with `apiFetch` in a `useEffect` and stores a failure in state, then throws
  it during the next render (an effect's own throw is invisible to React error boundaries) — this is
  what AC-7's "thrown to the app error screen" requires.
- A save failure (as opposed to a load failure) is always caught and shown inline via an `Alert` +
  per-field `FormField` errors, never re-thrown — losing the user's in-progress edits to an error
  boundary on a failed Save would be worse than showing the error next to the form.
