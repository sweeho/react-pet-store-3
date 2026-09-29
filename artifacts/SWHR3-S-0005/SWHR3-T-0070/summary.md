---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0070
---

# Summary — SWHR3-T-0070

Added `lib/cart-actions.ts`: the `CartAction` union (C5) and `applyCartAction(sessionToken, action, outer?)`, which runs one immediate-mode `withTransaction` (joining `outer` when given) and dispatches `ADD_ITEM`, `DELETE_ITEM`, `UPDATE_ITEMS` (per entry) and `EMPTY` to `lib/cart.ts`, each passed the transaction.

Files: `lib/cart-actions.ts`, `lib/cart-actions.test.ts`.

AC coverage: AC-1 by `[SWHR3-C-0079]` (joins outer) and `[SWHR3-C-0080]` (batch rolls back as a unit).

Deviation (minor): C-0080 triggers the mid-batch failure with a non-integer quantity rather than a mock of `updateItemQuantity`; same behaviour, no ESM spy fragility.

Verification: `bun run verify` exit 0, 495 tests passed.
