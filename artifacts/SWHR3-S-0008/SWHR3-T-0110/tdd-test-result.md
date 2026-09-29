---
artifact: tdd-test-result
ticket: SWHR3-T-0110
---

# TDD result — SWHR3-T-0110

## Test cases

`lib/order-processing.creation.test.ts` (in-memory db):

- SWHR3-C-0156: a valid cart and checkout persist an order readable by `getOrderRecord`: two lines, both contacts, one payment row, one outbox row.
- SWHR3-C-0160: ten orders get ten distinct integer ids, each with an `orders` row.
- SWHR3-C-0161: with `Date` faked at 2026-10-01T09:00:00Z, the returned `orderDate` and the stored `order_date` both equal that instant.
- SWHR3-C-0183: the order stores the given account and the billing email, not the shipping one; also proven through the real `POST /api/orders` handler with a session cookie and both middlewares.

## Red run

Not applicable. This ticket only proves behaviour that `processOrder` already has (plan step 2: no production change), so the new tests passed on their first run: 5 passed (5). No stub was possible without altering production code.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 120 files, 818 tests passed.

TDD-RESULT: 818 passed, 0 failed
