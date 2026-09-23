# PLAN — SWHR3-T-0009: Sign-on error state on the sign-in page

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 3. Sign-On Error Handling (every checkbox in it is tagged `(SWHR3-T-0009)`)
- **Requirements:** Sign-on error screen; User authentication via form-based login (invalid credentials)
- **Depends on:** SWHR3-T-0008 (same page file)

## Objective

A failed sign-in keeps the customer on /signin with the designed error banner and the exact legacy message, clears the password, and keeps the user name.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on-error.html`
- `artifacts/SWHR3-S-0001/design/wireframe-sign-on-error.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. In `src/pages/signin.tsx`, replace SWHR3-T-0007's minimal failure message with the `Alert` of `mockup-sign-on-error.html`. Place it above both panels with `role="alert"`. Its text content is exactly "There were errors signing you in. The user name and password you entered were not found in our records." (heading + body), followed by the mockup's hint line.
1. On failure, clear `j_password`, keep `j_username`, and move focus to the password field. The banner clears on the next submit.
1. Confirm server-side that a 401 from `/api/auth/signin` sets no `petstore_session` cookie. Add the assertion to `routes/api/auth/signin.post.test.ts` if SWHR3-T-0007 did not cover it.
1. Tests: extend `src/pages/signin.test.tsx` with the banner text, `role="alert"`, the cleared password and the preserved user name.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `src/pages/signin.tsx` (error state only)
- `src/pages/signin.test.tsx` (error cases)
- `routes/api/auth/signin.post.test.ts` (no-cookie-on-failure assertion only)

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
