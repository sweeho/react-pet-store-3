---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0090
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0090/tdd-test-result.md]
---

# Plan — SWHR3-T-0090: Purchase Order Entity — order columns, order_contacts table and insertPurchaseOrder

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 8. Requirement(s): "Shipping address collection". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0089.

## Objective

The schema holds an order's snapshots per C1, and `lib/purchase-orders.ts` writes a whole `PurchaseOrder` through a caller's transaction.

## Steps

1. Extend `db/schema.ts` per C1 and D3: four nullable columns on `orders`, and the new `orderContacts` table. Register it in `db/client.ts`, generate migration `0005` and commit it with its meta snapshot. Existing `orders` rows and `lib/orders.ts` must keep working unchanged.
2. Create `lib/purchase-orders.ts` per C8: the `PurchaseOrder` type and `toPurchaseOrder(accountId, event, lines, now)` (emailId from `billTo.email`; `customerName` "given family" from billTo; `totalCents` = sum of `cartItemTotalCostCents`).
3. Add `insertPurchaseOrder(tx, po): number`. It inserts the `orders` row (status `PENDING`, SD9) and then two `order_contacts` rows (`BILL_TO`, `SHIP_TO`). It also inserts one `line_items` row per line, `lineNumber` from 1, `categoryId` = `category` and `unitPriceCents` = `unitCostCents`.
4. Test in `lib/purchase-orders.test.ts`: different billing and shipping addresses read back as two distinct rows; a null `address2` stays null; line items and total are correct; `emailId` equals the billing email even when shipping has another.

## File/module ownership

- `db/schema.ts`
- `db/client.ts` (schema registration only)
- `drizzle/0005_*.sql, drizzle/meta/*`
- `lib/purchase-orders.ts, lib/purchase-orders.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 8 checkboxes tagged with this key are stamped when it merges.
