---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0129
---

# Summary — SWHR3-T-0129

- `db/schema.ts`, `db/client.ts`: `supplier_purchase_orders.status` now defaults to `PENDING`; new tables `supplier_po_contacts` and `supplier_po_addresses` (both cascade on delete), `supplier_invoices` (unique `supplier_po_id`, status default `SENT`) and `supplier_fulfilment_attempts`, all per C1 and registered in the client.
- `drizzle/0007_condemned_pyro.sql` and its meta snapshot: the four tables plus the rebuild of `supplier_purchase_orders` (SQLite cannot change a default in place). The copy step maps `OPEN`→`PROCESSING` and `SHIPPED`→`COMPLETED` with a `CASE`, so existing rows are converted as they are copied rather than by a later `UPDATE`; the result is the same.
- `lib/supplier-order-status.ts` (C2): `SUPPLIER_ORDER_STATUSES`, `SupplierOrderStatus`, `assertSupplierOrderTransition` (legal only PENDING→PROCESSING and PROCESSING→COMPLETED; throws `InvalidTransitionError`).
- Status literals only: `lib/supplier-pos.ts` (`createSupplierPOs` writes `PROCESSING`; `markPoShipped` moves `PROCESSING`→`COMPLETED`), `lib/process-manager.ts` (`every(p => p.status === "COMPLETED")`) and their two test files.

Files: `db/schema.ts`, `db/client.ts`, `drizzle/0007_*`, `drizzle/meta/*`, `lib/supplier-order-status.ts`, `lib/supplier-order-status.test.ts`, `lib/supplier-order-status.migration.test.ts`, `lib/supplier-pos.ts`, `lib/supplier-pos.test.ts`, `lib/process-manager.ts`, `lib/process-manager.test.ts`.

Design: none applies (no UI; PLAN.md says so). The sign-in mockup named in the prompt belongs to a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0198]` (transition table and the migration test).

Verification: `bun run verify` exit 0 (868 tests), `bun run build` exit 0.
