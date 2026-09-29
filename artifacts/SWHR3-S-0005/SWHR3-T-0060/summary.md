---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0060
---

# Summary — SWHR3-T-0060

Added `deleteItem(sessionToken, itemId, outer?)` to `lib/cart.ts`: one delete scoped to token and itemId inside `withTransaction`; a no-op for an absent item or undefined token.

Files: `lib/cart.ts`, `lib/cart.test.ts`.

AC coverage: AC-1 by `[SWHR3-C-0061]`. Case SWHR3-C-0062 (`DELETE /api/cart/:itemId`) belongs to the route ticket; no route exists yet.

Verification: `bun run verify` exit 0, 472 tests passed.
