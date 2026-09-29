---
artifact: tdd-test-result
ticket: SWHR3-T-0114
---

# TDD result — SWHR3-T-0114

## Test cases

`lib/notifications.test.ts` (in-memory db, order written by `placeOrder`, moved to PAID with `setWorkflowStage`):

- SWHR3-C-0171: one row, kind ORDER_CONFIRMATION, status QUEUED, recipient the billing email; payload has the orderId, two lines (item, name, quantity, line total), totalCents 4548 and the ship-to address (city "San Francisco", no orderId/role keys); stage is CONFIRMED.
- an order at PENDING throws `InvalidTransitionError`, writes no outbox row and stays PENDING.

The case text calls `processOrder`, which is not on this branch yet (C8, another ticket), so the test calls `queueOrderConfirmation` directly on a PAID order.

## Red run

`bun --bun vitest run lib/notifications.test.ts` against a stub throwing `VortexNotImplemented`: 2 failed (2).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 116 files, 794 tests passed.

TDD-RESULT: 794 passed, 0 failed
