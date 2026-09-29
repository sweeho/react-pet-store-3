---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0098
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0098/tdd-test-result.md]
---

# Plan — SWHR3-T-0098: Security and Validation — signed-in checkout, account from session, order audit log line

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 16. Requirement(s): "Order creation with unique ID". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0095.

## Objective

It is proven that only a signed-in customer can place an order, and that the order always belongs to the session's account. Each placement writes the D11 log line.

## Steps

1. Add the D11 log line to `placeOrder` in `lib/checkout.ts`, after the transaction commits. It must carry no card data. Extend `lib/checkout.test.ts` to assert it once per order and never on failure.
2. Create `routes/api/orders/security.test.ts` (real `H3Event` through both middlewares):
   - `POST /api/orders` signed out or with an expired session answers 401 and writes nothing.
   - A body carrying `accountId`/`account_id` of another account is ignored, and the order's `account_id` is the session's.
   - Account B reading account A's order through `GET /api/orders/:id` gets 404.
   - A JSON body is required: a form-encoded post does not create an order (SD10).
3. Change no other production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/checkout.ts` (log line only), lib/checkout.test.ts
- `routes/api/orders/security.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 16 checkboxes tagged with this key are stamped when it merges.
