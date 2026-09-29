---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0059
---

# Summary — SWHR3-T-0059

Added `addItem(sessionToken, itemId, quantity = 1, outer?)` to `lib/cart.ts`: upserts on (`session_token`, `item_id`) inside `withTransaction` (re-add sets, D5). A quantity that is not a positive integer throws `ValidationError({ quantity })`; an undefined token writes nothing.

Files: `lib/cart.ts`, `lib/cart.test.ts`.

AC coverage: AC-1 by `[SWHR3-C-0057]`, AC-2 by `[SWHR3-C-0059]` and `[SWHR3-C-0060]`. Case SWHR3-C-0058 (`POST /api/cart`) belongs to the route ticket, since no route exists yet.

Verification: `bun run verify` exit 0, 469 tests passed.
