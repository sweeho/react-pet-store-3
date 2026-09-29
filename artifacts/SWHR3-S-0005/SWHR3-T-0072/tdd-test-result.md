---
artifact: tdd-test-result
ticket: SWHR3-T-0072
---

# TDD result — SWHR3-T-0072

## Test cases

- src/components/cart/cart-table.test.tsx: SWHR3-C-0046, C-0047, C-0048, C-0049 (table only).
- src/pages/cart.test.tsx (api mocked, MemoryRouter): C-0043, C-0044, C-0046, C-0047, C-0048, C-0049, C-0050, C-0052, plus a load-failure alert.

## Red run

`bun --bun vitest run src/pages/cart.test.tsx src/components/cart` against components stubbed to throw `VortexNotImplemented`: 2 files failed, 13 tests failed (13).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 91 files, 561 tests passed. `bun run build`: exit 0.

TDD-RESULT: 561 passed, 0 failed
