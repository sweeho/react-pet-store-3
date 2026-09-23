# PLAN — SWHR3-T-0022: Sign-on, registration and profile verified end to end

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 16. Testing & Integration (every checkbox in it is tagged `(SWHR3-T-0022)`)
- **Requirements:** All requirements of the change, cross-ticket
- **Depends on:** SWHR3-T-0009; SWHR3-T-0011; SWHR3-T-0014; SWHR3-T-0015; SWHR3-T-0019

## Objective

Prove the merged capability works as one journey in a real browser, and pin the two behaviours unit tests cannot: concurrent duplicate registration and idle timeout across real handlers.

## Design reference

- `artifacts/SWHR3-S-0001/design/all six mockups under artifacts/SWHR3-S-0001/design/`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `e2e/customer-auth.spec.ts`. Every test uses a unique user name (for example a timestamp plus a random suffix), because the dev database file persists between runs and Playwright runs fully parallel.
   - Register, fill the create-customer form, land on `/users/profile` with the values shown, sign out, sign in with Remember my user name ticked, sign out, and reopen `/signin` to find the user name pre-filled.
   - A signed-out visit to `/users/profile` goes to `/signin?redirect=%2Fusers%2Fprofile`; after signing in, the browser is back on `/users/profile`.
   - A wrong password shows the exact sign-on error message; a duplicate user name shows "That user name is already taken".
   - With `page.route` fulfilling `/api/customers/me` with a 500, the profile page shows the error screen heading.
1. Create `routes/api/auth/register.concurrency.test.ts`: two simultaneous handler calls for one user name give exactly one 201 and one 409 `DUPLICATE_ACCOUNT`, and exactly one `accounts` row.
1. Create `routes/api/session.timeout.test.ts`: sign in through the handlers, advance time 31 minutes with `vi.setSystemTime`, and `GET /api/customers/me` answers 401 "Session timed out".
1. Run the whole E2E tier, including `e2e/smoke.spec.ts` and `e2e/home.spec.ts`, and fix any spec of your own that flakes.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## Notes

- A defect found in another ticket's code is fixed here only if it is a small, contained change inside a file that ticket owned and has already merged; otherwise raise a DEFECT.

## File/module ownership

This ticket may create or modify only these files:

- `e2e/customer-auth.spec.ts`
- `routes/api/auth/register.concurrency.test.ts`
- `routes/api/session.timeout.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
