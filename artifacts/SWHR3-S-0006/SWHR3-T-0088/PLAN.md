---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0088
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0088/tdd-test-result.md]
---

# Plan — SWHR3-T-0088: Order ID Generation — unique order ids and current order date under concurrency

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 6. Requirement(s): "Order creation with unique ID". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0087.

## Objective

It is proven that every placed order gets a distinct id that is never reused, and an order date equal to the time of placement (D5).

## Steps

1. Create `lib/checkout.order-id.test.ts`. Place 20 orders for different carts, sequentially and through interleaved `Promise.all` calls, and assert 20 distinct `orderId`s. Delete the highest order and place another: its id is higher than any ever issued, because of `AUTOINCREMENT`. With fake timers set to a fixed instant, `orderDate` equals that instant.
2. If a case fails, fix it in `lib/checkout.ts` or `lib/purchase-orders.ts` only, and name the fix in the work log.

## File/module ownership

- `lib/checkout.order-id.test.ts`
- `lib/checkout.ts, lib/purchase-orders.ts` (defect fixes only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 6 checkboxes tagged with this key are stamped when it merges.
