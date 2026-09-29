---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0114
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0114/tdd-test-result.md]
---

# Plan — SWHR3-T-0114: Order Notifications — ORDER_CONFIRMATION outbox row

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 6. Requirement(s): "Order confirmation notification". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0113.

## Objective

`queueOrderConfirmation` writes one `ORDER_CONFIRMATION` outbox row carrying order details, total and ship-to address, and moves the order to CONFIRMED (D4, C5).

## Steps

1. Create `lib/notifications.ts` per C5 and D4. It reads the order with `getOrderRecord` in `tx`. The payload JSON is `{ orderId, email, lines: [{ itemId, name?, quantity, lineTotalCents }], totalCents, shipTo }`, recipient = the order email and status `QUEUED`. Then it calls `setWorkflowStage(tx, orderId, 'CONFIRMED')`. `line_items` carries no name, so omit it or read it from the catalogue.
2. Test in `lib/notifications.test.ts`: for a PAID order, one row with the kind, recipient, status `QUEUED`, and a payload whose total and ship-to city match the order; stage CONFIRMED. For a PENDING order it throws and writes nothing.

## File/module ownership

- `lib/notifications.ts, lib/notifications.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 6 checkboxes tagged with this key are stamped when it merges.
