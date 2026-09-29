---
artifact: tdd-test-result
ticket: SWHR3-T-0089
---

# TDD result — SWHR3-T-0089

## Test cases

- SWHR3-C-0115 (lib/checkout-cart.test.ts): no rows, only a catalogue-missing row, and an undefined token each throw `ShoppingCartEmptyError` "Shopping cart is empty".
- extra: two lines come back enriched, in insertion order.

## Red run

`bun --bun vitest run lib/checkout-cart.test.ts` against a stub throwing `VortexNotImplemented`: 2 failed (2).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 94 files, 572 tests passed.

TDD-RESULT: 572 passed, 0 failed
