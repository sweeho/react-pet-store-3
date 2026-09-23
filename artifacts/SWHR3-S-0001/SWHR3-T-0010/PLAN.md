# PLAN — SWHR3-T-0010: Session lifecycle: 30-minute idle timeout, default locale, sign-out

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 4. Session Management (every checkbox in it is tagged `(SWHR3-T-0010)`)
- **Requirements:** Session lifecycle management; Session invalidation on logout
- **Depends on:** SWHR3-T-0017 (accounts; transitively auth config, errors, api client)

## Objective

Provide the one session module every other ticket uses: a sealed cookie holding the signed-in account and locale, a sliding 30-minute idle timeout that distinguishes expired from never signed in, sign-out, and the session read endpoint the client guard calls.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on.html` (footnote copy about the 30-minute session)
- `artifacts/SWHR3-S-0001/design/mockup-account-profile.html` (Sign out control)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/session.ts` (C8) on h3 `useSession` from `nitro/h3`, with `name: AUTH_CONFIG.sessionCookieName`, `password: getSessionSecret()`, and the cookie options of design.md D2.
1. `startSession` stores `{ accountId, username, locale: AUTH_CONFIG.defaultLocale, lastSeen: Date.now() }`.
1. `readSession` returns `none` when there is no cookie. It returns `expired` when a cookie is present but carries no data, or when `lastSeen` is older than `sessionTimeoutSeconds`; the stale session is cleared in both cases. Otherwise it re-seals with a fresh `lastSeen` and returns `active`.
1. `endSession` clears the session. `requireSessionUser` throws a 401 with "Session timed out" or "Authentication required" (D7).
1. Create `routes/api/session.get.ts` (C9), which answers `{ user, locale, expired }` and never 401s. Create `routes/api/auth/signout.post.ts`, which calls `endSession` and answers 204.
1. Create `src/components/auth/sign-out-button.tsx`, which posts with `apiFetch` and then navigates to `/signin`. SWHR3-T-0015 mounts it.
1. Tests: `lib/session.test.ts` uses `vi.setSystemTime`. It covers create, the 29-minute slide, 31-minute expiry, the default locale, an unreadable cookie reading as expired, and end. Add `routes/api/session.get.test.ts`, `routes/api/auth/signout.post.test.ts` and `src/components/auth/sign-out-button.test.tsx`.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/session.ts`
- `lib/session.test.ts`
- `routes/api/session.get.ts`
- `routes/api/session.get.test.ts`
- `routes/api/auth/signout.post.ts`
- `routes/api/auth/signout.post.test.ts`
- `src/components/auth/sign-out-button.tsx`
- `src/components/auth/sign-out-button.test.tsx`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
