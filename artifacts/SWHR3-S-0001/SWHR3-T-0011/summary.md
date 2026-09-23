---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0011
branch: vortex/feat/SWHR3-T-0011-5-protected-api-paths-and-pages-with-ret-ef0630f1
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0011/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0011: Protected API paths and pages, with return to the requested page

## What changed

Replaced the hardcoded `{ name: "Yeasin" }` context with the real session (design.md D7, C10) on both sides: `middleware/auth.ts` now resolves `readSession` into `event.context.user`/`locale` and 401s an exact-match protected API path with no active session; the client wraps routed pages in `RequireAuth`, which redirects a signed-out visit to a protected page to `/signin?redirect=<path>`.

## Files

- `lib/protected-resources.ts` (+ test) — `PROTECTED_API_PATHS` (frozen), `isProtectedApiPath` (exact match via a `Set`).
- `middleware/auth.ts` (+ test) — rewritten: session-driven `event.context.user`/`locale`, 401 on a protected path with none/expired; `H3EventContext` module augmentation for `user`/`locale`.
- `routes/api/hello.ts` (+ test) — greets `event.context.user?.username ?? "guest"`; no longer throws.
- `src/constants/protected-pages.ts` — `PROTECTED_PAGE_PATHS` (`/users/profile`, `/users/create`).
- `src/hooks/use-session.ts` (+ test) — `useSession()`, fetching `GET /api/session` on mount and on pathname change.
- `src/components/auth/require-auth.tsx` (+ test) — the client guard: loading fallback, redirect for a protected+signed-out path, pass-through otherwise.
- `src/main.tsx` — wraps `useRoutes(routes)` in `<RequireAuth>` inside the existing `<Suspense>`.

## AC coverage

- AC-1 (unauthenticated access redirected to signon page) — `require-auth.test.tsx › redirects a signed-out visitor away from a protected path…`.
- AC-2 (protected resource patterns matched exactly) — `protected-resources.test.ts › matches a protected path exactly` / `› does not match a path that merely starts with a protected prefix`.
- AC-3 (original URL stored for post-auth redirect) — met via the `redirect` query parameter (D7/SD8, not a session attribute — see design.md's spec-discrepancy interpretation); `require-auth.test.tsx › carries the visited path and query into the redirect query parameter`.
- AC-4 (expired session detected) — `middleware/auth.test.ts › throws 401 'Session timed out'…`; `use-session.test.tsx › resolves to a null user and expired:true…`.
- AC-5 (protected resources loaded/cached in memory) — `protected-resources.test.ts › lists exactly…` / `› is frozen` (module-load-time constant, SD10's interpretation of signon-config.xml).
- AC-6 (interface contract: `PROTECTED_API_PATHS`/`isProtectedApiPath`, `PROTECTED_PAGE_PATHS`, `event.context.user`) — see Files; asserted directly across `protected-resources.test.ts` and `middleware/auth.test.ts`.
- AC-7 (401 messages "Authentication required" / "Session timed out") — `middleware/auth.test.ts › throws 401 'Authentication required'…` / `› throws 401 'Session timed out'…`.
- AC-8 (`/users/profile` signed out → `/signin?redirect=%2Fusers%2Fprofile`) — `require-auth.test.tsx › redirects a signed-out visitor…` and `› carries the visited path and query…` (exact encoded value asserted).
- AC-9 (`/api/hello` "Hello guest"/"Hello <username>", smoke spec's API check) — `hello.test.ts` (3 tests); by inspection `/api/hello` is not in `PROTECTED_API_PATHS`, so `e2e/smoke.spec.ts`'s `/api/hello` check is expected to stay green (not executed here — see Verification).

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/protected-resources.test.ts middleware/auth.test.ts routes/api/hello.test.ts src/hooks/use-session.test.tsx src/components/auth/require-auth.test.tsx
Test Files  5 passed (5)
     Tests  22 passed (22)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  35 passed (35)
     Tests  207 passed (207)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 207 passed, 0 failed`. Red runs: new files confirmed by module-not-found; `middleware/auth.ts` and `routes/api/hello.ts` (rewrites) confirmed by resetting to their pre-ticket `HEAD` content and re-running the new tests against it (8/8 failed as expected).

## Notes

- `e2e/smoke.spec.ts` was not executed (Chromium unavailable in this container — see Verification). This ticket changes `src/main.tsx` and the home page's guard path, so it is the one place in this ticket where E2E matters most; by static reasoning `/` is not in `PROTECTED_PAGE_PATHS` and `GET /api/session` never 401s (C9), so the smoke spec's page-load and `/api/hello` assertions should be unaffected — Validation confirms this in the QA phase.
- AC-3's "session attribute ORIGINAL_URL" and AC-4/wording about an XML "Session Timed Out" response are legacy-terms criteria met through design.md's spec-discrepancy interpretations (SD8: the `redirect` query parameter, since an SPA navigation never reaches the server to write a session attribute; SD9: a JSON 401 instead of XML, since this API speaks JSON) — not reinterpreted here, just applied.
