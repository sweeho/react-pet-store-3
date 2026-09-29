---
artifact: tdd-test-result
ticket: SWHR3-T-0140
---

# TDD result — SWHR3-T-0140

## Test cases

`src/components/supplier/inventory-table.test.tsx`:

- SWHR3-C-0189: each row has an empty, editable text input named `qty_<itemId>`.
- SWHR3-C-0190: each row has a checkbox named `item_<itemId>`, unticked at first; typing a value ticks the row and the footer reads "1 item marked for update".
- SWHR3-C-0193: a row's cells are checkbox, item ID, current quantity ("1,240"), new-quantity input; columns are Update (screen-reader label), Item ID, Current quantity, New quantity.
- SWHR3-C-0194: no rows shows "No inventory items to show." and no rows.
- extra: reported fields change with typing and unticking; saved rows carry an "updated" marker; the footer action renders.

`src/pages/supplier/index.test.tsx` (session fetch and `src/utils/supplier-api.ts` mocked):

- SWHR3-C-0185: rows list EST-1 1,240, EST-2 0, EST-3 318; masthead shows the user name and "Supplier administrator".
- SWHR3-C-0193: heading "Inventory", "3 items. Enter a new quantity and tick the row to include it — unticked rows are ignored.", four cells per row, "Update inventory" button.
- SWHR3-C-0192: after entering EST-1, EST-2, EST-3 and unticking EST-2, `updateInventory` gets the flat fields (EST-2 `item_` false), the banner reads "Inventory updated — 2 items saved." with the reprocessing line, EST-1 and EST-3 are marked "updated", rows refresh from the response, entries clear.
- SWHR3-C-0194: empty inventory shows the empty-state message.
- extra: a failed update and a failed load each show an alert; a failed update keeps the entries.

## Red run

`bun --bun vitest run src/pages/supplier/index.test.tsx src/components/supplier/inventory-table.test.tsx` against components stubbed to throw `VortexNotImplemented`: 2 files failed, 13 failed (13).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 145 files, 1010 tests passed. `bun run build`: exit 0.

TDD-RESULT: 1010 passed, 0 failed
