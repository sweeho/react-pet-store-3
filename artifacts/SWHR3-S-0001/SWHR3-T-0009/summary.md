---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0009
branch: vortex/feat/SWHR3-T-0009-3-sign-on-error-state-on-the-sign-in-pag-6ccbfaab
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0009/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0009: Sign-on error state on the sign-in page

## What changed

Replaced SWHR3-T-0007's minimal `role="alert"` text with the designed error banner from `mockup-sign-on-error.html`, shown above both panels on a failed sign-in. On failure the password field is cleared and refocused while the user name is kept; the banner clears at the start of the next submit.

## Files

- `src/pages/signin.tsx` — `signInFailed` state replaces the old `error` message string; renders an `Alert`/`AlertTitle`/`AlertDescription` banner (exact legacy message + the mockup's hint sentence) above the two-panel layout; clears/refocuses the password field via a `ref` in the catch branch.
- `src/pages/signin.test.tsx` — replaced the old minimal-message test with three: the banner's exact text + `role="alert"`, the cleared/refocused password + kept user name + no navigation, and the banner clearing as soon as the next submit starts.
- `routes/api/auth/signin.post.test.ts` — unchanged; the no-session-cookie-on-401 assertion PLAN.md step 3 calls for already existed from SWHR3-T-0007.

## AC coverage

- AC-1 (render `signon_error.screen` with the exact legacy message) — `signin.test.tsx › shows the designed error banner…` asserts both the title "There were errors signing you in" and the body "The user name and password you entered were not found in our records." verbatim.
- AC-2 (deny authentication, forward to the sign-on error page) — met by the existing 401 path (`routes/api/auth/signin.post.ts`, unchanged) plus the client now rendering the designed error state instead of a minimal message.
- AC-3 (password field empty, user name kept after a failed sign-in) — `signin.test.tsx › clears the password field and keeps the user name…`.
- AC-4 (banner above both panels, `role="alert"`, matches `mockup-sign-on-error.html`) — same test asserts the banner via `screen.getByRole("alert")` (found before either panel's fields), matching the mockup's placement and copy.
- AC-5 (no session cookie on failure; `GET /api/session` still reports `user: null`) — the "no session cookie" half is `routes/api/auth/signin.post.test.ts › answers 401 and sets no session cookie on a wrong password` (pre-existing, unmodified). The `GET /api/session` half is met by construction: `readSession` reports `none`/`expired` whenever no valid session cookie exists, and `/api/session`'s `user: null` response for that case is already covered by SWHR3-T-0010's `routes/api/session.get.test.ts`, outside this ticket's file ownership — not re-tested here to avoid duplicating that coverage.

## Verification

```
$ NODE_ENV=test bun --bun vitest run src/pages/signin.test.tsx
Test Files  1 passed (1)
     Tests  12 passed (12)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  38 passed (38)
     Tests  226 passed (226)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 226 passed, 0 failed`. Red run: `signin.tsx` reset to its pre-ticket `HEAD` content, 2/12 tests failed as expected (the banner text and the clear/focus behavior — the two things this ticket actually changes), then restored.

## Notes

- Opened `mockup-sign-on-error.html` directly. The banner's visible copy is two parts: the exact legacy sentence from AC-1 ("There were errors signing you in" / "The user name and password you entered were not found in our records.") as the `AlertTitle`/`AlertDescription` lead sentence, followed by the mockup's additional hint sentence ("Check for typos and try again — passwords are case sensitive.") appended to the description, per PLAN.md step 1's "(heading + body), followed by the mockup's hint line."
- The banner is shown for any sign-in failure (any thrown `ApiError`), not conditioned on status 401 specifically — the legacy sign-on error screen has no differentiated messaging by failure cause, and PLAN.md describes an unconditional replacement of the prior minimal message.
