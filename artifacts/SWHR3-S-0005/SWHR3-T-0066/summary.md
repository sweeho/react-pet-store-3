# Summary — SWHR3-T-0066

Added `empty(sessionToken, outer?)` to `lib/cart.ts`: one `DELETE ... WHERE session_token = ?` inside `withTransaction`; a no-op for an undefined token or empty cart.

Files: `lib/cart.ts` (empty), `lib/cart.test.ts` (C-0074 = AC-1, plus the no-throw case).

Gap: linked case SWHR3-C-0075 (DELETE /api/cart integration) needs a route handler that does not exist yet and is outside this ticket's ownership; the route ticket must cover it.

Verification: red run 2 failed against the stub; `bun run verify` exit 0, 491 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
