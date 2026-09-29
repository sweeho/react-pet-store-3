---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0073
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0073/tdd-test-result.md]
---

# Plan — SWHR3-T-0073: Struts Configuration — cart client API, cart constants and the /checkout guard

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 16. Requirement(s): "Empty cart checkout prevention". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0069.

## Objective

The client has one typed binding for every cart endpoint and the shared cart constants, and `/checkout` refuses an empty cart.

## Steps

1. Create `src/constants/cart.ts` per C10 and re-export it from `src/constants/index.ts`.
2. Create `src/utils/cart-api.ts` (+ test) per C10: `getCart`, `addToCart`, `updateCart`, `removeFromCart`, `emptyCart`, each via `apiFetch` with the C9 method and path (encode the itemId path segment), returning `CartView` from `src/types/cart.ts`.
3. Create `src/pages/checkout.tsx` (+ `checkout.test.tsx`) per D10 and SD9. It loads `getCart()`. With `count === 0` it renders an `Alert` with `EMPTY_CART_CHECKOUT_MESSAGE` and a link back to `CART_PATH`, and no order-entry content. Otherwise it renders an "Enter Order Information" heading placeholder.
4. The page test mocks `src/utils/cart-api.ts` for both branches.

## File/module ownership

- `src/constants/cart.ts`
- `src/constants/index.ts` (re-export line only)
- `src/utils/cart-api.ts, src/utils/cart-api.test.ts`
- `src/pages/checkout.tsx, src/pages/checkout.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

The idea carries no design blocks, so there is nothing under `artifacts/SWHR3-S-0005/design/`. The visible contract is the delta spec's two display requirements plus the PRD's fixed-width desktop non-goal. Build from the existing primitives in `src/components/ui/` (`Table`, `Input`, `Button`, `Alert`) and the tokens in `src/index.css`, the way `src/components/admin/orders-table.tsx` does.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 16 checkboxes tagged with this key are stamped when it merges.
