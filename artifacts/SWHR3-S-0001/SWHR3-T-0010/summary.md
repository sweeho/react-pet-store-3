---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0010
branch: vortex/feat/SWHR3-T-0010-4-session-lifecycle-30-minute-idle-timeo-1c716de0
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0010/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0010: Session lifecycle: 30-minute idle timeout, default locale, sign-out

## What changed

Added `lib/session.ts` (C8): a sealed-cookie session on h3's `updateSession`/`unsealSession`/
`clearSession`, with a sliding 30-minute idle timeout implemented via a `lastSeen` field re-sealed on
every active read, rather than h3's absolute `maxAge`. Added `GET /api/session` and
`POST /api/auth/signout` (C9), and the `SignOutButton` component that calls the latter then navigates
to `/signin`.

## Files

- `lib/session.ts` — `SessionUser`, `startSession`, `readSession`, `endSession`, `requireSessionUser`.
- `lib/session.test.ts` — 9 cases: create, none, unreadable-cookie, the 29/29-minute sliding window,
  31-minute expiry, end, and `requireSessionUser`'s three outcomes.
- `routes/api/session.get.ts` (+ test) — never 401s; reports `{ user, locale, expired }`.
- `routes/api/auth/signout.post.ts` (+ test) — `endSession` then 204.
- `src/components/auth/sign-out-button.tsx` (+ test) — posts to sign-out, navigates to `/signin`
  even on a failed request.

## AC coverage

- AC-1 — session created with the account id and default locale: `lib/session.test.ts › creates a
session carrying the account, and defaults the locale to en_US`.
- AC-2 — timeout enforcement (`readSession`'s `expired` branch, and the unreadable-cookie case; D7
  messages via `requireSessionUser`).
- AC-3 — default locale `en_US` when not already present: `startSession` always writes
  `AUTH_CONFIG.defaultLocale`, asserted in the same create test as AC-1.
- AC-4 — session invalidation on sign-out: `endSession`/`signout.post.test.ts`.
- AC-5 — interface contract: `lib/session.ts` exports match C8 exactly;
  `routes/api/session.get.test.ts` and `routes/api/auth/signout.post.test.ts` pin the C9 response
  shapes.
- AC-6 — `lib/session.test.ts › stays active and restarts its idle window when read 29 minutes...`
  (two consecutive 29-minute gaps, 58 minutes since creation, still active) and `› reads as expired 31
minutes after the last activity`.
- AC-7 — `sign-out-button.test.tsx` (2 cases).

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/session.test.ts   # red, before lib/session.ts existed
Cannot find module './session'
$ bun run verify                                             # green, after implementation
Test Files  25 passed (25)
     Tests  151 passed (151)
```

`bun run verify:full`'s E2E tier could not run — Chromium is not installed in this container
(documented AGENTS.md fallback, same as prior tickets this sprint). See `tdd-test-result.md` for the
full red/green detail.

## Notes

- `readSession` reads the raw cookie with `getChunkedCookie` before calling any of h3's
  `getSession`/`useSession` helpers, because those unconditionally create and seal a brand-new empty
  session (setting its cookie) the instant they see no valid one — which would make a first-ever visit
  indistinguishable from a since-expired one on the very next read. Reading the raw cookie first keeps
  `none` and `expired` reliably separate, as D2 and AC-1 require.
- The idle timeout does not use h3's `maxAge` (that is absolute from seal time, not from last
  activity — SD18); it re-seals with a fresh `lastSeen` on every active `readSession` call instead.
- `SignOutButton`'s sign-out request failure is caught and swallowed deliberately: the button always
  ends at `/signin` regardless of the request outcome (see `tdd-test-result.md` for the red this
  caught).
