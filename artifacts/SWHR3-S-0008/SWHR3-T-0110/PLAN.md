---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0110
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0110/tdd-test-result.md]
---

# Plan — SWHR3-T-0110: Order Creation — id, date, customer and total through processOrder

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 2. Requirement(s): "Order creation with validation", "Unique order ID generation", "Order date capture", "Order customer association". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

It is proven that an order placed through `processOrder` is persisted with a unique id, the current date, the session's account and the billing email (SD8, SD9).

## Steps

1. Create `lib/order-processing.creation.test.ts`:
   - A valid cart and checkout give an `orders` row readable by `getOrderRecord`.
   - Ten orders get ten distinct ids.
   - Under fake timers `order_date` equals the fixed instant.
   - `account_id` is the given account, and `email` is the billing email when shipping differs.
2. Change no production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/order-processing.creation.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 2 checkboxes tagged with this key are stamped when it merges.
