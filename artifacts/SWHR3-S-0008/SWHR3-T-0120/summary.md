---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0120
---

# Summary — SWHR3-T-0120

- `db/schema.ts`: `orders.workflow_stage` (text, not null, default `PENDING`); new tables `order_stage_history`, `payment_authorizations`, `notification_outbox`, `inventory`, `inventory_reservations`, `supplier_purchase_orders`; nullable `line_items.supplier_po_id` referencing `supplier_purchase_orders.id`. All per C1. The six tables are registered in `db/client.ts`.
- `drizzle/0006_wild_captain_cross.sql` and its meta snapshot: one migration for all of it. Existing orders read `workflow_stage = 'PENDING'`.
- `lib/order-records.ts`: `getOrderRecord(orderId, tx?)` returns `{ order, lines, contacts, stageHistory, payment, outbox, reservations, supplierPos }` and throws `NotFoundError` for an unknown id; `listOrdersByStage(stage, tx?)`. Read-only.

Deviations (minor): (1) `lib/line-items.test.ts` (not on this ticket's ownership list) needed two one-line edits because the new nullable `supplier_po_id` column changes the row shape those tests assert (`supplierPoId: null` and its key in the field list); their case keys and intent are unchanged. (2) `getOrderRecord` also returns the `outbox` collection, which the plan's test step mentions though C2's sentence does not list it; `listOrdersByStage` takes a plain string because `lib/workflow-stage.ts` (`WorkflowStage`) is a later ticket.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0178]`.

Verification: `bun run verify` exit 0 (726 tests), `bun run build` exit 0.
