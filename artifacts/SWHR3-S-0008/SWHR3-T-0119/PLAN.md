---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0119
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0119/tdd-test-result.md]
---

# Plan — SWHR3-T-0119: EJB Transaction Management — placement and allocation atomicity and rollback suite

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 11. Requirement(s): "Transaction atomicity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

It is proven that placement (order, lines, contacts, payment, outbox, stage history, cart emptying) and allocation (reservations, POs, stage) are each all-or-nothing (D3, D5, SD3).

## Steps

1. Create `lib/order-workflow.atomicity.test.ts`:
   - A declined card via `processOrder` leaves no order, `order_contacts`, `line_items`, payment, outbox or stage-history row, and the cart intact.
   - An authorizer that approves, followed by a forced failure in `queueOrderConfirmation` (e.g. a spy that throws), leaves the same nothing.
   - A failure injected in `createSupplierPOs` during `allocateOrder` leaves inventory quantities, reservations and the stage unchanged.
   - `processOrder` given an outer transaction joins it: `db.transaction` is called once.
2. Change no production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/order-workflow.atomicity.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 11 checkboxes tagged with this key are stamped when it merges.
