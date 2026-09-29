---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0121
---

# TDD result — SWHR3-T-0121

## Test cases

`src/pages/checkout.test.tsx` (mocks `cart-api`, `orders-api` and `apiFetch`): SWHR3-C-0167 (a 402 `PAYMENT_DECLINED` shows a destructive alert with "Your card was declined. No order was placed." and "Check your card details or use another card."; the card number, a shipping city and pre-filled billing are kept; no navigation and no empty-cart state); the alert clears when the order is resubmitted.

`lib/order-processing.test.ts`: a decline logs one `console.warn("order-workflow: payment declined for account <id>")` with no card digits and no error log; an unexpected failure (authorizer throws) logs one `console.error` naming the account with the error, rethrows it, and leaves no order and the cart untouched; an empty cart logs neither.

## Red run

`bun run test src/pages/checkout.test.tsx lib/order-processing.test.ts` before the page and logging changes: 3 failed, 25 passed. The resubmit-clears-alert test passes in red because the generic alert is cleared the same way. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 121 files, 829 tests passed. `bun run build` exit 0. No browser run (no Chromium in this container).

TDD-RESULT: 829 passed, 0 failed
