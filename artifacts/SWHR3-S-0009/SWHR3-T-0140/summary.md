# Summary — SWHR3-T-0140

`/supplier` now shows the inventory and submits ticked rows.

- `src/components/supplier/inventory-table.tsx`: controlled-by-itself table (checkbox `item_<itemId>`, item ID with an "updated" marker for saved rows, current quantity formatted "1,240", input `qty_<itemId>`), a footer count ("No items marked for update" / "N item(s) marked for update") with a slot for the submit button, and an empty-state message. Typing a value ticks the row; every change reports the flat form fields to the page.
- `src/pages/supplier/index.tsx`: inside `RequireSupplier` and `SupplierShell`; heading, "N items. Enter a new quantity and tick the row to include it — unticked rows are ignored." line, the table, "Update inventory". It sends the fields through `updateInventory`, then shows "Inventory updated — N items saved." with the reprocessing line, refreshes rows from the response, marks saved rows and clears the entries. Load and update failures show a destructive alert; invalid rows are left to the server (SD7).
- Tests cover SWHR3-C-0185, C-0189, C-0190, C-0192, C-0193, C-0194 (AC-1..AC-4) plus the failure paths.

Design: I read `mockup-supplier-inventory-listing-and-update.html` and `mockup-supplier-inventory-after-update.html` (structure, copy, banner, "updated" marker, footer). Styling uses the project's existing primitives and tokens rather than the mockup's own CSS, so spacing is close but not pixel-matched; the visual was not checked in a browser. Decisions: rows with an entered value or a tick are sent (an unticked row with a value goes as `item_<id>: false`, per C-0192); the checkbox column header is a screen-reader-only "Update".

Verification: red run 13 failed against stubs; `bun run verify` exit 0, 1010 tests passed; `bun run build` exit 0. E2E not run. `a2a_run_tests` not used: the project has no testEvidence block.
