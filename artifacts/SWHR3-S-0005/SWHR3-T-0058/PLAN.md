---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0058
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0058/tdd-test-result.md]
---

# Plan — SWHR3-T-0058: Shopping Cart Session Bean — cart/catalogue/line-item schema, cart cookie and cart state

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 1. Requirement(s): "Stateful shopping cart session bean", "LineItem container-managed persistence entity", "LineItem quantity tracking". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency; first in the chain.

## Objective

The four C1 tables exist in one committed migration. Every request under `/api/cart` carries its anonymous cart token in `event.context.cartSession`. `lib/cart.ts` exists with its constants and `getDetails`, which every later cart ticket extends.

## Steps

1. Add `cartItems`, `catalogItems`, `catalogItemDetails` and `lineItems` to `db/schema.ts` exactly as C1 (D1, D3, D11). Register them in `db/client.ts`'s schema object, generate migration `0004`, and commit it with its meta snapshot.
2. Create `middleware/cart-session.ts` per C8 and D1. It declares the `cartSession` context augmentation, reads `petstore_cart`, treats a non-UUID value as absent, and mints a UUID cookie only for a non-GET/HEAD request. Test it with a real `H3Event` as `middleware/auth.test.ts` does.
3. Create `lib/cart.ts` with `CART_COOKIE_NAME`, `DEFAULT_CART_LOCALE`, `CartDetails` and `getDetails(sessionToken, outer?)` per C2. It returns a fresh object, `{}` for an unknown or undefined token, and reads through `withTransaction` (D2).
4. Test in `lib/cart.test.ts`: a new token reads `{}`; rows inserted under a token read back on a second call (persistence across requests); two tokens never see each other's rows.
5. Test `line_items` in `lib/line-items.test.ts`: insert a row for a fixture order with all seven fields, `quantity` 10 and `quantityShipped` 5, and read both back unchanged. Omitting `quantityShipped` stores 0.

## File/module ownership

- `db/schema.ts`
- `db/client.ts` (schema object registration only)
- `drizzle/0004_*.sql, drizzle/meta/*`
- `middleware/cart-session.ts, middleware/cart-session.test.ts`
- `lib/cart.ts, lib/cart.test.ts` (create)
- `lib/line-items.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 1 checkboxes tagged with this key are stamped when it merges.
