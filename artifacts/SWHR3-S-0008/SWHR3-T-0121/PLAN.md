---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0121
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0121/tdd-test-result.md]
---

# Plan — SWHR3-T-0121: Error Handling — payment-declined message on /checkout and workflow diagnostics logging

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 13. Requirement(s): "Payment processing". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

A declined card is explained on `/checkout` with nothing placed. Workflow failures and waits are logged for diagnosis (tasks 13.x, SD6).

## Steps

1. In `src/pages/checkout.tsx`, on a 402 `PAYMENT_DECLINED` `ApiError` render a destructive `Alert` above the form with the server message and "Check your card details or use another card." Keep every entered value; the cart is untouched. This follows the DESIGN.md "two layers of errors" rule, whole-submission layer. Extend `src/pages/checkout.test.tsx`.
2. In `lib/order-processing.ts`, log `console.warn('order-workflow: payment declined for account <id>')` on a decline, with no card data, and `console.error` with the order context on any unexpected failure before rethrowing. Allocation waits are logged by the process manager's own ticket and are not duplicated here.
3. Tests: the page shows the alert and keeps its values on a mocked 402; the route test posting the decline card gives 402, no order and one warn line.

## File/module ownership

- `src/pages/checkout.tsx, src/pages/checkout.test.tsx`
- `lib/order-processing.ts` (logging only), lib/order-processing.test.ts

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

No new screen. The decline alert reuses the destructive `Alert` whole-submission pattern in DESIGN.md "Forms", placed where `artifacts/SWHR3-S-0006/design/mockup-checkout-missing-required-fields.html` puts its summary alert.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 13 checkboxes tagged with this key are stamped when it merges.
