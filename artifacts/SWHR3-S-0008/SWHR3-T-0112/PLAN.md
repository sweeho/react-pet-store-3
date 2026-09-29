---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0112
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0112/tdd-test-result.md]
---

# Plan — SWHR3-T-0112: Payment Processing — PaymentAuthorizer seam, no-charge default and PaymentDeclinedError

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 4. Requirement(s): "Payment processing". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0113.

## Objective

Payment is authorised through a seam whose default never charges. An approval records the authorisation and moves the order to PAID; a decline throws `PaymentDeclinedError` (D2, C4).

## Steps

1. Add `PaymentDeclinedError` (402, `PAYMENT_DECLINED`, "Your card was declined. No order was placed.") to `lib/errors.ts`, and extend `lib/errors.test.ts`.
2. Create `lib/payment.ts` per C4. `noChargeAuthorizer` declines `DECLINE_TEST_CARD` and approves every other card, with `transactionId` `NOCHARGE-<uuid>` and a six-character `authorizationCode`; it contacts nothing. `authorizePayment` writes `payment_authorizations` (processor `no-charge`) and calls `setWorkflowStage(tx, orderId, 'PAID')`. On a decline it writes nothing and throws.
3. Test in `lib/payment.test.ts` against a `placeOrder`-written order: approval gives one authorization row with the amount and stage PAID; the decline card throws `PaymentDeclinedError` and leaves no row with stage PENDING; an injected authorizer is used instead of the default.

## File/module ownership

- `lib/payment.ts, lib/payment.test.ts`
- `lib/errors.ts, lib/errors.test.ts` (the new error only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 4 checkboxes tagged with this key are stamped when it merges.
