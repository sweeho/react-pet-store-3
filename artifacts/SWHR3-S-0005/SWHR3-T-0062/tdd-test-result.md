---
artifact: tdd-test-result
ticket: SWHR3-T-0062
---

# TDD result — SWHR3-T-0062

## Test cases

- SWHR3-C-0069: getItems returns CartItems carrying catalogue details (lib/cart.test.ts)
- SWHR3-C-0070: an item missing from the catalogue is logged and skipped (lib/cart.test.ts)
- extra: getItems(undefined) returns []

## Red run

`bun --bun vitest run lib/cart.test.ts` against a `getItems` stub throwing `VortexNotImplemented`: 3 failed | 16 passed (19).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 77 files, 480 tests passed.

TDD-RESULT: 480 passed, 0 failed
