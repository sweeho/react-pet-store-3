---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0109
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0109/tdd-test-result.md]
---

# Plan — SWHR3-T-0109: Order Validation — empty cart, session and checkout-data preconditions through processOrder

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 1. Requirement(s): "Order creation with validation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

It is proven that `processOrder` and `POST /api/orders` refuse an order before anything is written when the cart is empty, the caller is signed out, or checkout data is incomplete (SD9).

## Steps

1. Create `lib/order-processing.validation.test.ts`: an empty or unknown cart through `processOrder` throws `ShoppingCartEmptyError` with no order, payment or outbox row.
2. Extend it with route cases (real `H3Event`): signed out gives 401; a missing card number gives 422 listing `credit_card_number`; a missing shipping city gives 422 listing `city_b`. Each leaves the orders count unchanged.
3. Change no production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/order-processing.validation.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 1 checkboxes tagged with this key are stamped when it merges.
