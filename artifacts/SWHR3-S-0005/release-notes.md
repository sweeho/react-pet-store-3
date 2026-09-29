---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
idea: SWHR3-I-0004
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [artifacts/SWHR3-S-0005/qa-test-report.md]
---

# Release notes — SWHR3-S-0005

Shoppers now have a shopping cart. They can add items, change quantities, remove items and see the subtotal without signing in.

## Added

- **Cart page at `/cart`.**
  - An empty cart shows "Your Shopping Cart is Empty".
  - A populated cart shows one row per item, with name and attribute, an editable quantity, a Remove control, unit price and line total, then a subtotal row, an "Update Cart" button and a "Check Out" link.
  - Setting a quantity to 0, a negative number or anything non-numeric and clicking Update Cart removes the item. (SWHR3-T-0072, SWHR3-T-0061, SWHR3-T-0069)
- **Checkout guard at `/checkout`.** An empty cart shows "The Shopping Cart is Empty and the order could not be placed." A populated cart reaches an "Enter Order Information" placeholder until checkout ships. (SWHR3-T-0073)
- **Anonymous, per-browser carts.** A cart lives in its own `petstore_cart` cookie for the browser session. Signing in or out does not change it, and no role is required. (SWHR3-T-0058, SWHR3-T-0068)
- **Catalogue details by language.** Cart lines take name, attribute and price from the catalogue in the shopper's locale, falling back to US English. An item no longer in the catalogue is left out rather than breaking the cart. (SWHR3-T-0071, SWHR3-T-0062, SWHR3-T-0065)
- **All-or-nothing updates.** Every cart change runs in a database transaction; an "Update Cart" with several quantities applies all of them or none. (SWHR3-T-0070)
- **API** (every endpoint answers with the whole cart):
  - `GET /api/cart`
  - `POST /api/cart` with `{ itemId, quantity? }`; the quantity defaults to 1, and an unknown item answers 404 `CATALOG_ITEM_NOT_FOUND`.
  - `PUT /api/cart` with `itemQuantity_<itemId>` fields.
  - `DELETE /api/cart/:itemId`.
  - `DELETE /api/cart` empties the cart.

  (SWHR3-T-0069, SWHR3-T-0059, SWHR3-T-0060, SWHR3-T-0066)

## Upgrade notes

- **Database migration** `drizzle/0004_perpetual_katie_power.sql` creates `cart_items`, `catalog_items`, `catalog_item_details` and `line_items`. The app applies it automatically on start. `line_items` is empty until checkout ships.
- **Demo data:** `bun db/seed-catalog.ts` seeds items EST-1 to EST-4 in English and Japanese; it is safe to run repeatedly. There is no catalogue UI yet, so items are added with `POST /api/cart`.

## Known limitations

- Shoppers always see English catalogue names, because sessions do not yet carry the profile language (SWHR3-T-0077).
- Abandoned carts are never deleted from the database (SWHR3-T-0076).
- `/checkout` is a placeholder; orders cannot yet be placed.
