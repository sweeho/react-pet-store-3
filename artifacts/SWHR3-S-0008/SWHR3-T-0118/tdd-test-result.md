# TDD result — SWHR3-T-0118

## Test cases

- SWHR3-C-0172: approving an order at CONFIRMED reserves stock, decrements inventory, writes reservations, stage ALLOCATED (`lib/order-approval.test.ts`).
- SWHR3-C-0179: shipping the only PO with `TRK-123` gives PO SHIPPED with tracking and `shipped_at`, stage SHIPPED, status COMPLETED.
- SWHR3-C-0180: one of two POs shipped leaves stage ALLOCATED, status APPROVED, `orderCompleted` false.
- Also covered: waiting at CONFIRMED with no writes, SKIPPED cases, `retryWaitingAllocations`, denied orders not allocated, an unstocked approval still commits, `completeOrder`, and `assertSystemTransition` (APPROVED->COMPLETED is system-only; admin rules unchanged).

## Red run

Stubs throwing `VortexNotImplemented` and the tests committed first (c745ae5). `bun --bun vitest run lib/process-manager.test.ts lib/order-status.test.ts lib/orders.test.ts lib/order-approval.test.ts`: 18 failed, 35 passed (the passing ones assert existing or negative behaviour). `a2a_run_tests` was not used: the project has no testEvidence block (refused on earlier tickets).

## Green run

Full gate `bun run verify` (lint + typecheck + unit): 120 files, 831 tests passed.

TDD-RESULT: 831 passed, 0 failed
