---
artifact: tdd-test-result
ticket: SWHR3-T-0064
---

# TDD result — SWHR3-T-0064

## Test cases

- SWHR3-C-0072: count is the number of distinct items, not the total quantity (lib/cart.test.ts)
- SWHR3-C-0073: count of an empty cart is 0 (lib/cart.test.ts)
- extra: one item counts 1 and another token's rows are ignored

The "getDetails returns a copy" check already exists in lib/cart.test.ts ("two tokens never see each other's rows, and the result is a fresh object").

## Red run

`bun --bun vitest run lib/cart.test.ts` against a `getCount` stub throwing `VortexNotImplemented`: 3 failed | 22 passed (25).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 77 files, 486 tests passed.

TDD-RESULT: 486 passed, 0 failed
