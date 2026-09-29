# Summary — SWHR3-T-0064

Added `getCount(sessionToken, outer?)` to `lib/cart.ts`: a `count()` of the token's `cart_items` rows (distinct items, not quantities); `0` for an undefined token or empty cart.

Files: `lib/cart.ts` (getCount, `count` import), `lib/cart.test.ts` (C-0072 = AC-1, C-0073 = AC-2, plus a one-item/other-token case). The `getDetails` copy behaviour was already proven by an existing test, so no new one was added.

Verification: red run 3 failed against the stub; `bun run verify` exit 0, 486 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
