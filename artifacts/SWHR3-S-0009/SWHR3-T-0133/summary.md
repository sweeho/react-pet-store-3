# Summary — SWHR3-T-0133

Added to `lib/inventory.ts` (C5, D8): `InventoryRow`; `getInventory(tx?)` (left join of `catalog_items` to `inventory`, missing row reads 0, ordered by item id); `getInventoryItem(itemId, tx?)` (same join for one item, `NotFoundError` for a non-catalogue item); `updateQuantity(tx, itemId, quantity)` (reads the old quantity, upserts through `setInventory`, returns `{ before, after }`). `reserveInventory` and `setInventory` are unchanged.

Tests: `lib/inventory.test.ts` covers SWHR3-C-0200 (AC-1) and C-0201 (AC-2). The listing test filters to its own `LST-` items because the catalogue is shared within the file.

No UI change, so no design consulted.

Verification: red run 3 failed against stubs; `bun run verify` exit 0, 883 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
