---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0061
---

# Summary — SWHR3-T-0061

Added `updateItemQuantity(sessionToken, itemId, quantity, outer?)` to `lib/cart.ts`: `quantity <= 0` calls `deleteItem`, otherwise `addItem` (upsert, so an absent item is added, SD14). Both run in `withTransaction`.

Files: `lib/cart.ts`, `lib/cart.test.ts`.

AC coverage: AC-1 `[SWHR3-C-0063]`, AC-2 `[SWHR3-C-0064]`, AC-3 `[SWHR3-C-0065]`.

Verification: `bun run verify` exit 0, 477 tests passed.
