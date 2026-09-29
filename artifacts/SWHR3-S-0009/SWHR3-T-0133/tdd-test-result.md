---
artifact: tdd-test-result
ticket: SWHR3-T-0133
---

# TDD result — SWHR3-T-0133

## Test cases

`lib/inventory.test.ts` (in-memory db), new describe "inventory listing and updates":

- SWHR3-C-0200: `getInventory` lists every catalogue item in item order (LST-1 5, LST-2 0, LST-3 with no row 0); `getInventoryItem("LST-3")` is `{ itemId, quantity: 0 }`; `getInventoryItem("NOPE")` throws `NotFoundError`.
- SWHR3-C-0201: `updateQuantity` from 5 to 12 returns `{ before: 5, after: 12 }`, from no row to 4 returns `{ before: 0, after: 4 }`, and both persist.

## Red run

`bun --bun vitest run lib/inventory.test.ts` against stubs throwing `VortexNotImplemented`: 3 failed | 6 passed (9); the 6 are the existing reservation and `setInventory` tests.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 128 files, 883 tests passed.

TDD-RESULT: 883 passed, 0 failed
