---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0140
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0140/tdd-test-result.md]
---

# Plan — SWHR3-T-0140: Inventory Display View — the /supplier inventory page and table

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 13. Requirement(s): "Inventory display screen", "Inventory update form", "Inventory update page". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0144.

## Objective

`/supplier` shows every item's ID and current quantity with a new-quantity input and an update checkbox per row, and submits ticked rows (D7, D8).

## Steps

1. Create `src/components/supplier/inventory-table.tsx` (+ test) from `Table`, `Input` and `Checkbox`. Its columns are Item ID, Current quantity and New quantity, with a checkbox per row. Inputs are named `qty_<itemId>` and checkboxes `item_<itemId>`. Typing a value ticks the row. Saved rows show an "updated" marker. It shows an empty-state message when there are no items.
2. Create `src/pages/supplier/index.tsx` (+ test), rendered inside `SupplierShell` with `RequireSupplier` (SWHR3-T-0144). It loads `getInventory()` and shows the heading, the count line, the table, the "N items marked for update" footer and "Update inventory". Submitting sends `FormData` as a flat object through `updateInventory`. It then shows "Inventory updated — N items saved." and the reprocessing line, and refreshes the rows from the response. A request failure shows a destructive alert. Invalid rows are silent (SD7).
3. Tests mock `src/utils/supplier-api.ts`: the rows and columns render; the input and checkbox names are correct; ticking two rows sends only those fields; the success banner count is right; saved rows are marked.

## File/module ownership

- `src/pages/supplier/index.tsx, src/pages/supplier/index.test.tsx`
- `src/components/supplier/inventory-table.tsx, src/components/supplier/inventory-table.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build the main content and shell of `artifacts/SWHR3-S-0009/design/mockup-supplier-inventory-listing-and-update.html` and `artifacts/SWHR3-S-0009/design/mockup-supplier-inventory-after-update.html` (structure in the matching wireframes):

- The "Inventory" heading, and the line "N items. Enter a new quantity and tick the row to include it — unticked rows are ignored."
- The table (Item ID, Current quantity, New quantity), with a checkbox per row and an "updated" marker on saved rows.
- The footer count "N items marked for update" / "No items marked for update", and the "Update inventory" button.
- The success banner "Inventory updated — N items saved." with "Pending supplier orders are being reprocessed against the new quantities."

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 13 checkboxes tagged with this key are stamped when it merges.
