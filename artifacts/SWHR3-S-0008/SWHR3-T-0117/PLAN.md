---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0117
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0117/tdd-test-result.md]
---

# Plan — SWHR3-T-0117: Order Processing Facade — processOrder in one transaction, wired into POST /api/orders

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 9. Requirement(s): "Service locator integration". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0112, SWHR3-T-0114, SWHR3-T-0115, SWHR3-T-0116.

## Objective

`processOrder` places, pays and confirms an order in one immediate transaction, and `POST /api/orders` uses it (D3, C8, C10).

## Steps

1. In `lib/checkout.ts`, extract the transaction body of `placeOrder` into an exported `placeOrderInTx(tx, input)` that does not log. `placeOrder` keeps its exact behaviour: it wraps `placeOrderInTx` and logs after commit. Existing checkout tests stay green.
2. Create `lib/order-processing.ts` `processOrder` per C8. Inside `withTransaction(fn, outer, { behavior: 'immediate' })` it calls `placeOrderInTx`, then `authorizePayment` with the order's card and total (authorizer from options or the default), then `queueOrderConfirmation`. The checkout log line is written once, after commit.
3. Switch `routes/api/orders/index.post.ts` from `placeOrder` to `processOrder`. `readJsonBody` and authentication order are unchanged; a 402 comes through `toHttpError`. Extend `routes/api/orders/index.post.test.ts` so a successful post leaves stage CONFIRMED with one payment row and one outbox row.
4. SD7 (ServiceLocator): add `lib/order-processing.modules.test.ts` proving every collaborator is a statically imported ES module that resolves at import time: `lib/checkout`, `lib/payment`, `lib/notifications`, `lib/workflow-stage`, `lib/inventory`, `lib/supplier-pos`. There is no runtime registry that can fail to find one.

## File/module ownership

- `lib/checkout.ts, lib/checkout.test.ts` (placeOrderInTx extraction only)
- `lib/order-processing.ts, lib/order-processing.test.ts, lib/order-processing.modules.test.ts`
- `routes/api/orders/index.post.ts, routes/api/orders/index.post.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 9 checkboxes tagged with this key are stamped when it merges.
