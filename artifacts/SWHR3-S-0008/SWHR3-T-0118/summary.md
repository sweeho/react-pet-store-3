# SWHR3-T-0118 summary

- `lib/process-manager.ts` (C9): `allocateOrder` (SKIPPED unless APPROVED at CONFIRMED; reserve, supplier POs, stage ALLOCATED, or WAITING with no writes), `retryWaitingAllocations` (one immediate transaction per candidate, returns count), `recordShipment` (immediate transaction; when all POs are shipped, stage SHIPPED and `completeOrder`).
- `lib/order-status.ts`: `assertSystemTransition` allows APPROVED->COMPLETED only; admin rules and `ASSIGNABLE_STATUSES` unchanged. `lib/orders.ts`: `completeOrder`.
- `lib/order-approval.ts`: `updateOrders` calls `allocateOrder` inside its transaction for each order moved to APPROVED; WAITING never fails the batch.
- `db/ship-supplier-po.ts`, `db/allocate-waiting.ts`: operator scripts printing JSON. Not executed against a database in this run; they only wrap the tested functions.
- Tests: `lib/process-manager.test.ts`, plus additions to `lib/order-status.test.ts`, `lib/orders.test.ts`, `lib/order-approval.test.ts` (with an `afterEach` clearing rows that reference orders).

AC coverage: "update status to SHIPPED and track via supplier tracking numbers" -> SWHR3-C-0179, C-0180; inventory reservation on approval -> C-0172.

Verification: `bun run verify` exit 0 (831 tests passed).
