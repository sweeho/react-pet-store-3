---
artifact: tdd-test-result
ticket: SWHR3-T-0115
---

# TDD result — SWHR3-T-0115

## Test cases

`lib/inventory.test.ts` (in-memory db, orders placed through `placeOrder`):

- SWHR3-C-0173: stock EST-1 = 5, EST-2 = 0, order for 2 and 1: returns false, stock unchanged, no reservation rows.
- stock 5 and 3, reserve 2 and 3: true, stock 3 and 0, two reservation rows.
- stock 2 and 3, reserve 2 and 4: false, both quantities unchanged, no rows.
- an item with no inventory row counts as 0: false.
- repeated lines for one item are summed against stock.
- `setInventory` inserts a missing row and overwrites an existing one.

`db/seed-inventory.ts` was run by hand against a scratch `sqlite.db` (removed afterwards): `--item`, `--all`, an unknown item (exit 1) and a negative quantity (exit 1).

## Red run

`bun --bun vitest run lib/inventory.test.ts` against stubs throwing `VortexNotImplemented`: 6 failed (6).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 114 files, 739 tests passed.

TDD-RESULT: 739 passed, 0 failed
