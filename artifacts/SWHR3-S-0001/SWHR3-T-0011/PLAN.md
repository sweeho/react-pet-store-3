# PLAN — SWHR3-T-0011: Protected API paths and pages, with return to the requested page

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 5. Protected Resources & Access Control (every checkbox in it is tagged `(SWHR3-T-0011)`)
- **Requirements:** Protected resource access control; Protected resource configuration; Session timeout detection
- **Depends on:** SWHR3-T-0010 (lib/session.ts, /api/session)

## Objective

Replace the hardcoded user with the real session. Unauthenticated calls to protected API paths get 401. Signed-out visits to protected pages go to /signin and come back after sign-in.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on.html` (the page the guard lands on)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/protected-resources.ts` (C10): a frozen `PROTECTED_API_PATHS` array and an exact-match `isProtectedApiPath(pathname)` using a `Set` built once at module load (design.md SD10).
1. Rewrite `middleware/auth.ts`. Call `readSession`. If the session is active, set `event.context.user = { id, username }` and `event.context.locale`. If the path is protected and the session is not active, throw a 401 with "Session timed out" (expired) or "Authentication required" (none) (D7). Add the `event.context` typing in the same file via module augmentation of `H3EventContext`.
1. Update `routes/api/hello.ts` to greet `event.context.user?.username ?? "guest"`, and rewrite `routes/api/hello.test.ts` for the no-session and signed-in cases. `e2e/smoke.spec.ts` still expects `/api/hello` to answer 200.
1. Create `src/constants/protected-pages.ts` (`PROTECTED_PAGE_PATHS`) and `src/hooks/use-session.ts`. The hook fetches `GET /api/session` through `apiFetch` on mount and on every pathname change, and exposes `{ loading, user, locale, expired }`.
1. Create `src/components/auth/require-auth.tsx`. While loading it renders the Suspense fallback. For a protected path with no user it returns `<Navigate replace to={`/signin?redirect=${encodeURIComponent(pathname + search)}`} />`. Wrap the `useRoutes` output in it inside `src/main.tsx`.
1. Tests: `middleware/auth.test.ts` (server project) covers the none, expired and active cases plus a non-protected path. Add `lib/protected-resources.test.ts`, `src/components/auth/require-auth.test.tsx` (MemoryRouter, mocked fetch) and `src/hooks/use-session.test.tsx`.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `middleware/auth.ts`
- `middleware/auth.test.ts`
- `lib/protected-resources.ts`
- `lib/protected-resources.test.ts`
- `routes/api/hello.ts`
- `routes/api/hello.test.ts`
- `src/constants/protected-pages.ts`
- `src/hooks/use-session.ts`
- `src/hooks/use-session.test.tsx`
- `src/components/auth/require-auth.tsx`
- `src/components/auth/require-auth.test.tsx`
- `src/main.tsx` (guard wrapper)

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
