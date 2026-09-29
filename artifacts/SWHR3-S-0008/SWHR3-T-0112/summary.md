---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0112
---

# Summary — SWHR3-T-0112

- `lib/errors.ts`: `PaymentDeclinedError` (402, `PAYMENT_DECLINED`, "Your card was declined. No order was placed.").
- `lib/payment.ts` (C4): `PaymentAuthorizer` seam, `DECLINE_TEST_CARD`, `noChargeAuthorizer` (declines only the test card; otherwise approves with `NOCHARGE-<uuid>` and a six-character code; no I/O), and `authorizePayment(tx, orderId, card, amountCents, authorizer?)`, which inserts the `payment_authorizations` row (processor `no-charge`) and calls `setWorkflowStage(tx, orderId, "PAID")`, or throws `PaymentDeclinedError` before writing anything.

Files: `lib/payment.ts`, `lib/payment.test.ts`, `lib/errors.ts`, `lib/errors.test.ts`.

Note: the recorded processor is always `no-charge`, including for an injected authorizer, as the plan states; a real processor would add its own name when one exists.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0164]`; `[SWHR3-C-0165]` covers the no-contact default.

Verification: `bun run verify` exit 0 (800 tests), `bun run build` exit 0.
