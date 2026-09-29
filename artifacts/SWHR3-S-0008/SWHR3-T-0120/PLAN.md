---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0120
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0120/tdd-test-result.md]
---

# Plan — SWHR3-T-0120: Order Persistence — workflow schema, migration 0006 and order finders

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 12. Requirement(s): "Order total price storage". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency; first in the chain.

## Objective

The workflow tables and columns of C1 exist in one committed migration, and `lib/order-records.ts` reads a whole order back.

## Steps

1. Extend `db/schema.ts` exactly per C1: `orders.workflowStage` default `PENDING`, and the six new tables plus `line_items.supplierPoId`. Register the new tables in `db/client.ts`, then generate migration `0006` and commit it with its meta snapshot. Existing rows read `workflow_stage = 'PENDING'`; checkout, order-approval and their tests keep passing unchanged.
2. Create `lib/order-records.ts` per C2. `getOrderRecord` throws `NotFoundError` for an unknown id.
3. Test in `lib/order-records.test.ts`: an order written by `placeOrder` reads back with `totalCents` equal to the sum of its lines, `workflowStage` `PENDING`, and empty payment, outbox, reservation and supplier-PO collections. `listOrdersByStage('PENDING')` includes it.

## File/module ownership

- `db/schema.ts`
- `db/client.ts` (schema registration only)
- `drizzle/0006_*.sql, drizzle/meta/*`
- `lib/order-records.ts, lib/order-records.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 12 checkboxes tagged with this key are stamped when it merges.
