---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0136
---

# Summary — SWHR3-T-0136

Added `lib/inventory-update.ts` (C7, D6): `applyInventoryUpdate(updates, outer?)` runs in one immediate `withTransaction` (joining `outer` when given). It calls `updateQuantity` for each update, logs `inventory-update: <item> quantity <before> -> <after>`, then `processPendingSupplierOrders(tx)`, and returns `{ updated, processedOrders, fulfilledOrders }`. Any failure rolls back both the quantities and the reprocessing. Zero is accepted (SD6).

Files: `lib/inventory-update.ts`, `lib/inventory-update.test.ts`.

Note: `processedOrders` and `fulfilledOrders` count PENDING supplier POs across the whole system, not only those the update could affect, as C7 and case SWHR3-C-0212 specify.

Design: none applies (no UI; PLAN.md says so). The sign-in mockup named in the prompt belongs to a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0212]` (update then retry of every pending PO) and AC-2 by `[SWHR3-C-0208]` (zero and positive quantities saved).

Verification: `bun run verify` exit 0 (957 tests), `bun run build` exit 0.
