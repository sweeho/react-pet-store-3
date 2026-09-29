---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
idea: SWHR3-I-0007
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [artifacts/SWHR3-S-0009/qa-test-report.md]
---

# Release notes — SWHR3-S-0009

Supplier staff now have their own portal to keep stock up to date. Orders waiting for stock are fulfilled as soon as it is recorded, and each shipped order is invoiced and completed.

## Added

- **Supplier portal at `/supplier`**, with sign-in at `/supplier/signin`.
  - It is only for accounts with the **Supplier administrator** role. Customers and store administrators see "Access denied".
  - The page lists every item with its current quantity. Enter a new quantity and tick the row (typing ticks it for you), then choose **Update inventory**; only ticked rows with a whole number of 0 or more are saved. A banner confirms how many items were saved, and those rows are marked.

  (SWHR3-T-0128, SWHR3-T-0144, SWHR3-T-0140)

- **Waiting orders are fulfilled when stock arrives.** Saving stock immediately retries every supplier order still waiting for it; each order is filled in full or not at all. Approving an order still fills it straight away when stock is already there. (SWHR3-T-0136, SWHR3-T-0137, SWHR3-T-0139)
- **Invoices.** Shipping a supplier order produces an invoice with its lines and total, records what was shipped, and marks the order Completed once all its supplier orders have shipped. (SWHR3-T-0138)
- **API** (supplier role only; 401 when signed out, 403 for other roles):
  - `GET /api/supplier/inventory`
  - `POST /api/supplier/inventory`, a JSON body of `qty_<itemId>` and `item_<itemId>` fields.

  (SWHR3-T-0135, SWHR3-T-0134)

## Changed

- **Supplier order statuses** are now Pending, Processing and Completed, replacing Open and Shipped. Existing records are converted automatically. Approved orders that are short of stock now hold a Pending supplier order instead of none. (SWHR3-T-0129, SWHR3-T-0137)

## Fixed

- **Upgrading a database that already holds supplier orders no longer fails at startup.** Migrations now run with foreign-key checks paused, and are verified afterwards. (Found and fixed during integration QA.)

## Upgrade notes

- **Database migration** `drizzle/0007_condemned_pyro.sql` converts supplier order statuses and adds the delivery contact/address, invoice and fulfilment-attempt tables. The app applies it on start. If a foreign-key problem is found afterwards, startup stops with an error rather than running on inconsistent data.
- **Granting supplier access:** `bun run supplier:grant <username>` gives an existing account the Supplier administrator role. Store administrators do not get supplier access automatically.
- `db/ship-supplier-po.ts --po <id> --tracking <number>` still records a shipment, and now also produces the invoice.

## Known limitations

- Suppliers see item IDs only, with no names or images, and never see customer or order details.
- There is no confirmation or shipping email yet.
- Shipments are still recorded with the operator script; the portal has no shipping screen.
