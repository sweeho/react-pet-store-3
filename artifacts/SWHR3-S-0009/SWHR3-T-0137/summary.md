---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0137
---

# Summary — SWHR3-T-0137

- `lib/supplier-fulfilment.ts` (C8): `fulfilSupplierOrder(tx, poId)` is `SKIPPED` unless the PO is PENDING; it checks every item's total quantity against stock and, when all are covered, reserves the stock, moves the PO to PROCESSING through `assertSupplierOrderTransition`, and sets the order to ALLOCATED when it is at CONFIRMED and every PO of it is PROCESSING. On a shortage it deducts nothing and returns `UNABLE` with `shortItems`. `processPendingSupplierOrders(tx)` runs every PENDING PO oldest first and returns `{ processed, fulfilled }`.
- `lib/process-manager.ts`: `allocateOrder` now creates the POs as PENDING (dropping the temporary `PROCESSING` option, so they carry the delivery contact and address, C12) and fulfils each; it returns ALLOCATED when the order reached that stage, else WAITING. `retryWaitingAllocations()` delegates to `processPendingSupplierOrders` in one immediate transaction and returns the fulfilled count.
- Tests updated for SD9: a waiting order now has a PENDING PO (`lib/process-manager.test.ts`, `lib/order-approval.test.ts`).

Files: `lib/supplier-fulfilment.ts`, `lib/supplier-fulfilment.test.ts`, `lib/process-manager.ts`, `lib/process-manager.test.ts`, `lib/order-approval.test.ts`.

Note: recording the UNABLE attempt and logging the shortage are a later ticket's (`fulfilSupplierOrder` returns `shortItems` for it). Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0206]`, AC-2 and AC-3 by `[SWHR3-C-0213]` (retry after stock arrives, PENDING to PROCESSING, order ALLOCATED); `[SWHR3-C-0214]` keeps the immediate allocation.

Verification: `bun run verify` exit 0 (912 tests), `bun run build` exit 0.
