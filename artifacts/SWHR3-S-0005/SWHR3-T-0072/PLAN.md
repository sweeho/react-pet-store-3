---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0072
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0072/tdd-test-result.md]
---

# Plan — SWHR3-T-0072: Cart Display View — the /cart page

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 15. Requirement(s): "Empty shopping cart display", "Shopping cart display with items". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0073.

## Objective

`/cart` renders the shopper's cart from `GET /api/cart`: an empty-state message, or a table of lines with editable quantities, Remove, subtotal, Update Cart and Check Out.

## Steps

1. Create `src/components/cart/cart-table.tsx` (+ `cart-table.test.tsx`), modelled on `src/components/admin/orders-table.tsx` and using the `Table`, `Input` and `Button` primitives. Each row shows the name and attribute, a Remove control whose accessible name is "Remove", and a text input named `itemQuantity_<itemId>` (maxLength 10) with the current quantity. It also shows the unit price and the line total. A subtotal row sits at the bottom. Currency uses `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` over cents / 100 (D6).
2. Create `src/pages/cart.tsx` (+ `cart.test.tsx`). Load with `getCart()` from `src/utils/cart-api.ts` (C10) into local state. With `count === 0` show `EMPTY_CART_MESSAGE` and no table. Otherwise show a `<form>` wrapping the table, an "Update Cart" submit and a "Check Out" link to `CHECKOUT_PATH`.
3. Submitting collects every `itemQuantity_*` field from `FormData` and calls `updateCart` (SD4). Remove calls `removeFromCart`. Every response replaces state (D9), so removing the last line shows the empty state. Keep the layout fixed-width desktop (PRD non-goal).
4. The page test mocks `src/utils/cart-api.ts` and covers empty; populated (row cells, input name and value, subtotal text); Update Cart sending the edited fields; Remove of the last item switching to the empty message; and the Check Out href.

## File/module ownership

- `src/pages/cart.tsx, src/pages/cart.test.tsx`
- `src/components/cart/cart-table.tsx, src/components/cart/cart-table.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

The idea carries no design blocks, so there is nothing under `artifacts/SWHR3-S-0005/design/`. The visible contract is the delta spec's two display requirements plus the PRD's fixed-width desktop non-goal. Build from the existing primitives in `src/components/ui/` (`Table`, `Input`, `Button`, `Alert`) and the tokens in `src/index.css`, the way `src/components/admin/orders-table.tsx` does.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5
- AC-6
- AC-7
- AC-8 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 15 checkboxes tagged with this key are stamped when it merges.
