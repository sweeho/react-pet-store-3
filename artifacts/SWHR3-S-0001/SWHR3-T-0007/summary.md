---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0007
branch: vortex/feat/SWHR3-T-0007-1-sign-on-page-and-sign-in-api-with-reme-f8c08397
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0007/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0007: Sign-on page and sign-in API with remember-my-user-name

## What changed

Added `POST /api/auth/signin` (design.md C11): verifies credentials, starts a session on a match, and sets/clears the `bp_signon` cookie per `j_remember_username` (D6). Added `/signin` (`src/pages/signin.tsx`): the Returning customer panel from `mockup-sign-on.html`, prefilled from `bp_signon`, submitting to the new route and redirecting on success. Added `src/utils/cookies.ts`'s `readCookie` for the client-side cookie read.

## Files

- `routes/api/auth/signin.post.ts` — the sign-in handler.
- `routes/api/auth/signin.post.test.ts` — 200/401/422 and bp_signon set/delete cases, real `H3Event`.
- `src/utils/cookies.ts` — `readCookie(name)`.
- `src/utils/cookies.test.ts` — unit tests against jsdom's real `document.cookie`.
- `src/pages/signin.tsx` — the `/signin` page (Returning customer form + a placeholder New customer panel for SWHR3-T-0008).
- `src/pages/signin.test.tsx` — field names/roles, cookie prefill, submit body, redirect handling, minimal failure message.

## AC coverage

- AC-1 (username/password fields, sign-in button, remember checkbox) — `signin.test.tsx › renders the returning-customer fields…`.
- AC-2 (username prefilled from bp_signon) / AC-6 (cookie read on subsequent visits) — `cookies.test.ts` (4 tests) + `signin.test.tsx › pre-populates…` / `› leaves the user name field empty…`.
- AC-3 (accepts j_username/j_password/optional j_remember_username) — `signin.post.test.ts › answers 422…` (missing fields) and `signin.test.tsx › submits j_username/j_password/j_remember_username…` (request body asserted verbatim).
- AC-4 (valid credentials authenticate, session created) — `signin.post.test.ts › answers 200…` and `› answers 401 for an unknown user name`; the "ServiceLocator lookup" is met by construction (static import of `lib/accounts.ts`), already documented in `lib/errors.ts`'s module doc from SWHR3-T-0016 per design.md SD3/SD4.
- AC-5 (cookie set on preference) — `signin.post.test.ts › sets bp_signon with the user name when j_remember_username is true`.
- AC-7 (interface contract: 200/401/422 shapes) — all `signin.post.test.ts` cases.
- AC-8 (remember false/absent deletes bp_signon) — `signin.post.test.ts › deletes bp_signon when j_remember_username is false or absent`.
- AC-9 (redirect to the `redirect` query param when it's a single leading slash, else `/users/profile`) — `signin.test.tsx › submits…and navigates to a same-origin redirect…` and `› navigates to /users/profile when redirect is absent or not a single leading slash` (covers the `//host` open-redirect case).
- AC-10 (panel matches mockup-sign-on.html) — see Notes; `signin.test.tsx › renders…` asserts the panel structure/copy.

## Verification

```
$ NODE_ENV=test bun --bun vitest run routes/api/auth/signin.post.test.ts src/utils/cookies.test.ts src/pages/signin.test.tsx
Test Files  3 passed (3)
     Tests  16 passed (16)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  30 passed (30)
     Tests  176 passed (176)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 176 passed, 0 failed`. Each new file's red run was proven by temporarily moving it aside and re-running its test, then restoring it.

## Notes

- Read `artifacts/SWHR3-S-0001/design/mockup-sign-on.html` directly (not just the canvas stub) and built the Returning customer panel's fields, helper text and copy from it. Per `design/MANIFEST.md`, the top bar, category nav and footer in every mockup belong to the storefront shell (`swhr3-i-0009`) and are explicitly out of scope this sprint — only the page body (heading, two panels, session footnote) was built.
- The New customer panel is a placeholder `<section aria-label="New customer">` with the mockup's heading/description and a "Coming soon" note — SWHR3-T-0008 owns its form, as directed by PLAN.md.
- Sign-in failure shows a minimal inline `role="alert"` message; PLAN.md assigns the designed error state (`mockup-sign-on-error.html`) to SWHR3-T-0009.
- The `useSearchParams` react-router hook is not in this project's `unplugin-auto-import` preset output (`auto-imports.d.ts` has `useNavigate`/`useLocation`/etc. but not it), so it's imported explicitly from `"react-router"` rather than left to auto-import — verified by checking `auto-imports.d.ts` before writing the import.
