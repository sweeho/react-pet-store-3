# PLAN — SWHR3-T-0008: New-customer registration panel and register API

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 2. User Registration (every checkbox in it is tagged `(SWHR3-T-0008)`)
- **Requirements:** User registration screen; New user registration and duplicate detection (valid new user)
- **Depends on:** SWHR3-T-0007 (same page file)

## Objective

A new customer picks a user name and password in the New customer panel on /signin, the account is created and signed in, and the browser moves on to /users/create.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on.html`
- `artifacts/SWHR3-S-0001/design/mockup-registration-error.html`
- `artifacts/SWHR3-S-0001/design/wireframe-registration-error.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `routes/api/auth/register.post.ts` (C12). Validate `j_username`, `j_password` and `j_password_confirm` with `lib/validation.ts` (C3); field errors go into a `ValidationError` keyed by parameter name. Call `createAccount` (C6), which throws `DuplicateAccountError` on a taken name. On success call `startSession` (C8) and answer 201 `{ user }`. Send every error through `toHttpError`.
1. Fill the New customer panel of `src/pages/signin.tsx`: `j_username`, `j_password` and `j_password_confirm` fields plus a Create new account button, with the copy of `mockup-sign-on.html`. Check the confirmation client-side with `validatePasswordConfirmation` before sending anything.
1. On 201, navigate to `/users/create`. On 409 `DUPLICATE_ACCOUNT`, render the `Alert` of `mockup-registration-error.html` (heading "That user name is already taken", body naming the user name) inside the panel and keep the typed user name. On 422, show each `fieldErrors` entry under its field.
1. Tests: `routes/api/auth/register.post.test.ts` covers 201 plus the session, 409, and 422 for mismatch, short password and a bad user name. Extend `src/pages/signin.test.tsx` with the panel's render, submit, duplicate and mismatch cases.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `routes/api/auth/register.post.ts`
- `routes/api/auth/register.post.test.ts`
- `src/pages/signin.tsx` (New customer panel only)
- `src/pages/signin.test.tsx` (registration cases)

**Deviation (minor, no contract/ownership impact):** the New customer panel's
fields carry the same labels as the Returning customer panel's ("User
name", "Password" — per mockup-sign-on.html), so a bare
`getByLabelText("User name")` is now ambiguous. Added one `aria-label`
attribute to the pre-existing Returning customer `<section>` (mirroring the
one the New customer section already had) so both panels can be queried
unambiguously via `getByRole("region", { name })`, and rescoped
`signin.test.tsx`'s pre-existing (T-0007) queries through that region
rather than a bare `screen.getByLabelText`. No copy or behaviour of the
Returning customer panel changed — one attribute, plus the test-scoping it
enables — and the "existing test suites stay green" DoD item requires it,
since T-0007's assertions become genuinely ambiguous the moment a second
"User name"/"Password" pair exists on the page.

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
