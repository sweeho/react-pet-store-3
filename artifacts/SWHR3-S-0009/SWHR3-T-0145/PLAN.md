---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0145
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0145/tdd-test-result.md]
---

# Plan — SWHR3-T-0145: Testing and Validation — end-to-end supplier portal, concurrent updates, full fulfilment workflow

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 18. Requirement(s): "Order fulfillment workflow". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0140, SWHR3-T-0142, SWHR3-T-0143.

## Objective

The whole supplier journey is driven in a real browser, and the full workflow (approval → PENDING PO → stock → fulfil → ship → invoice → completed) plus concurrent updates are proven.

## Steps

1. Create `e2e/supplier-portal.spec.ts`, seeding and granting as the other specs do. The journeys:
   - (a) A customer places an order, and an admin approves it with no stock: it waits.
   - (b) A supplier signs in, sets stock for the order's items with ticked rows, and sees the banner and updated markers.
   - (c) `db/ship-supplier-po.ts` ships the PO, and the order is in the admin Completed tab.
   - (d) An admin opening `/supplier` sees "Access denied".
   - (e) A ticked row with `-3` is ignored and its quantity is unchanged.
2. Create `lib/supplier-fulfilment.workflow.test.ts` covering the full chain in one test: approval, PENDING PO, `applyInventoryUpdate`, PROCESSING, `recordShipment`, the invoice, `quantity_shipped`, and COMPLETED.
3. Create `lib/supplier-inventory.concurrency.test.ts`: two concurrent `applyInventoryUpdate` calls on the same item end with one of the two values and a consistent reprocessing count (SD10).
4. Keep `e2e/order-workflow.spec.ts` passing, and run the new spec locally at least once. If Chromium is unavailable, say so.

## File/module ownership

- `e2e/supplier-portal.spec.ts`
- `lib/supplier-fulfilment.workflow.test.ts`
- `lib/supplier-inventory.concurrency.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build the main content and shell of `artifacts/SWHR3-S-0009/design/mockup-supplier-inventory-listing-and-update.html` and `artifacts/SWHR3-S-0009/design/mockup-supplier-inventory-after-update.html` (structure in the matching wireframes):

- The "Inventory" heading, and the line "N items. Enter a new quantity and tick the row to include it — unticked rows are ignored."
- The table (Item ID, Current quantity, New quantity), with a checkbox per row and an "updated" marker on saved rows.
- The footer count "N items marked for update" / "No items marked for update", and the "Update inventory" button.
- The success banner "Inventory updated — N items saved." with "Pending supplier orders are being reprocessed against the new quantities."
  Build `artifacts/SWHR3-S-0009/design/mockup-supplier-sign-in.html` ("Pet Store Supplier", "Sign in to manage inventory.", Username, Password, Sign in, "Supplier accounts are issued by the store administrator."). Also build `artifacts/SWHR3-S-0009/design/mockup-inventory-access-denied.html` ("Access denied", its two explanation paragraphs, and "Sign in as a different user"). The shared masthead shows "Pet Store Supplier", the user's name, the "Supplier administrator" label and Sign out. The wireframes show structure.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 18 checkboxes tagged with this key are stamped when it merges.
