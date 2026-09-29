---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0121
---

# Summary — SWHR3-T-0121

- `src/pages/checkout.tsx`: a 402 `PAYMENT_DECLINED` `ApiError` shows a destructive `Alert` above the form with the server message and "Check your card details or use another card."; every entered value stays and nothing navigates (the whole-submission error layer of DESIGN.md "Forms", placed where the missing-fields mockup puts its summary). It is cleared on the next submit.
- `lib/order-processing.ts` (logging only): a decline logs `console.warn("order-workflow: payment declined for account <id>")`; any other failure except an empty cart logs `console.error` with the account and the error, then rethrows. No card data is logged. An empty cart is an expected refusal and is not logged. Allocation waits are left to the process manager's ticket.

Files: `src/pages/checkout.tsx`, `src/pages/checkout.test.tsx`, `lib/order-processing.ts`, `lib/order-processing.test.ts`.

Deviation (minor): the plan's "route test posting the decline card gives 402, no order and one warn line" is covered at the `processOrder` level in `lib/order-processing.test.ts`; the 402 route test already exists in `routes/api/orders/index.post.test.ts` (T-0117), which is not on this ticket's ownership list, so I did not edit it.

Design: no new screen; reused the destructive `Alert`. Not viewed in a browser.

AC coverage: AC-1 by `[SWHR3-C-0167]`, plus the `processOrder` logging tests.

Verification: `bun run verify` exit 0 (829 tests), `bun run build` exit 0. E2E not run (no Chromium).
