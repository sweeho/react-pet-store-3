---
artifact: tdd-test-result
ticket: SWHR3-T-0111
---

# TDD result — SWHR3-T-0111

## Test cases

`lib/order-processing.lines.test.ts` (in-memory db, orders placed through `processOrder`):

- SWHR3-C-0162: cart EST-1 × 2 and EST-2 × 1 give two `line_items` numbered 1 and 2 carrying (FI-SW-01, EST-1, 2, 1999) and (K9-BD-01, EST-2, 1, 550).
- SWHR3-C-0163: `orders.total_cents` is 4548, and the outbox payload's `totalCents` (4548) and line totals (3998, 550) agree with it.

## Red run

Not applicable. This ticket only proves behaviour `processOrder` already has (plan step 2: no production change), so the tests passed on their first run: 2 passed (2). No stub was possible without altering production code.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 121 files, 820 tests passed.

TDD-RESULT: 820 passed, 0 failed
