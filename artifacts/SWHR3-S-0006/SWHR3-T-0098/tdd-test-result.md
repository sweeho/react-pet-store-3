---
artifact: tdd-test-result
ticket: SWHR3-T-0098
---

# TDD result — SWHR3-T-0098

## Test cases

- `routes/api/orders/security.test.ts` (real H3Event through auth and cart-session middleware): SWHR3-C-0122 (order's account is the session's), C-0123 (body `accountId`/`account_id` ignored), C-0124 (signed out: 401, no row), expired session: 401, no row.
- `lib/checkout.test.ts`: D11 log line once per order with exact text, written after commit (`db.$client.inTransaction` is false at log time), no card data; no log on failure.
- Not covered: "B reading A's order gets 404" (no `GET /api/orders/:id` route on this branch yet) and the form-encoded post (SD10), which the route accepts today; raised as defect SWHR3-T-0100.

## Red run

The security tests exercise existing behaviour and passed on first run. `bun --bun vitest run lib/checkout.test.ts` with the log still inside the transaction: 1 failed | 5 passed (6), "expected true to be false".

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 104 files, 649 tests passed.

TDD-RESULT: 649 passed, 0 failed
