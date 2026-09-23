# PLAN — SWHR3-T-0007: Sign-on page and sign-in API with remember-my-user-name

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 1. Authentication & Sign-On Forms (every checkbox in it is tagged `(SWHR3-T-0007)`)
- **Requirements:** Customer sign-on screen; Sign-on form parameters; User authentication via form-based login (valid credentials); Cookie-based remember username
- **Depends on:** SWHR3-T-0010 (session; transitively accounts, validators, errors, auth config)

## Objective

A returning customer signs in at /signin with a user name and password, optionally has the user name remembered in the bp_signon cookie, and is sent back to the page first requested.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on.html`
- `artifacts/SWHR3-S-0001/design/wireframe-sign-on.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `routes/api/auth/signin.post.ts`. Read the JSON body `{ j_username, j_password, j_remember_username? }` (C11). Answer 422 through `ValidationError` when either field is missing. Call `verifyCredentials` (C6). On a match, call `startSession(event, user)` (C8) and set `bp_signon` (max age `AUTH_CONFIG.rememberCookieMaxAgeSeconds`, not httpOnly, `sameSite: "lax"`, `path: "/"`) when `j_remember_username` is true; delete the cookie otherwise (design.md D6). Answer 200 `{ user }`. On no match, answer 401 without touching the session. Route every error through `toHttpError` (C2).
1. Create `src/utils/cookies.ts` with `readCookie(name): string | undefined`, which parses `document.cookie`.
1. Create `src/pages/signin.tsx` (route `/signin`), laid out as `mockup-sign-on.html`: page heading, and two panels side by side. The Returning customer panel is a form with `FormField` + `Input` named `j_username` (prefilled from `readCookie("bp_signon")`), `j_password` (type password), `Checkbox` `j_remember_username` with its helper text, and a Sign in `Button`. Leave a clearly marked New customer panel `<section>` for SWHR3-T-0008. Include the footnote about the 30-minute session.
1. Submit with `apiFetch` (C4) to `/api/auth/signin`. On success, navigate to the `redirect` query parameter when it starts with a single `/`, else to `/users/profile` (D7). Show failures in a minimal inline message for now; SWHR3-T-0009 owns the designed error state.
1. Tests: `routes/api/auth/signin.post.test.ts` (server project, the `H3Event` style of `routes/api/hello.test.ts`) covers 200 plus the session cookie, 401, 422, and the bp_signon set and delete cases. `src/pages/signin.test.tsx` covers the fields and names, the cookie prefill, and the redirect handling (mock `fetch`).

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `routes/api/auth/signin.post.ts`
- `routes/api/auth/signin.post.test.ts`
- `src/pages/signin.tsx`
- `src/pages/signin.test.tsx`
- `src/utils/cookies.ts`
- `src/utils/cookies.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
