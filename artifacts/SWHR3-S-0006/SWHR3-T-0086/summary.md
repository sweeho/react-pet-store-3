---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0086
---

# Summary — SWHR3-T-0086

Added `OrderEvent` and `parseCheckoutRequest(body)` to `lib/checkout-request.ts` (C6, D2). It reads billing from `_a`, shipping from `_b` and the card into one `FieldErrorCollector`, then throws a single `MissingFormDataError` if anything was recorded, else returns `{ shipper, receiver, creditCard }`. A non-object body throws with an empty field list. Error order is billing, shipping, card.

Files: `lib/checkout-request.ts`, `lib/checkout-request.test.ts`.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 `[SWHR3-C-0132]`, AC-2 `[SWHR3-C-0133]`, AC-3 `[SWHR3-C-0134]` and `[SWHR3-C-0135]`, plus `[SWHR3-C-0127]`. C-0133 and C-0134 were already in the file from earlier tickets and still pass.

Note: `lib/purchase-orders.ts` still declares a structural `OrderEventInput` (T-0090); `OrderEvent` satisfies it, and I left that file alone since it is outside this ticket.

Verification: `bun run verify` exit 0, 620 tests passed.
