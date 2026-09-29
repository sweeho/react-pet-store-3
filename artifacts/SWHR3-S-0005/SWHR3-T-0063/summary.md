---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0063
---

# Summary — SWHR3-T-0063

Added `getSubTotalCents(sessionToken, locale?, outer?)` to `lib/cart.ts`: the sum of `cartItemTotalCostCents` over `getItems`, so it is 0 for an empty or unknown cart and skips catalogue-missing items. Integer cents throughout (D6).

Files: `lib/cart.ts`, `lib/cart.test.ts`.

AC coverage: AC-1 `[SWHR3-C-0067]`, AC-2 `[SWHR3-C-0068]` (returns 0, the spec allows null or 0).

Verification: `bun run verify` exit 0, 483 tests passed.
