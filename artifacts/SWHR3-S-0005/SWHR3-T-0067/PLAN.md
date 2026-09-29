---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0067
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0067/tdd-test-result.md]
---

# Plan — SWHR3-T-0067: CartItem Value Object — CartItem type, totals, and client CartView mirror

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 10. Requirement(s): "CartItem value object". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0058.

## Objective

The `CartItem` shape and its cost helpers exist on the server, and the client has the `CartView`/`CartLine` response types to code against.

## Steps

1. Create `lib/cart-item.ts` per C3: the `CartItem` interface, `createCartItem(item: CatalogItem, quantity)`, `cartItemTotalCostCents`, `cartItemUnitCost` and `cartItemTotalCost` (D6, SD7). Import only the `CatalogItem` type from `lib/catalog.ts`. If that file does not exist yet, declare `CatalogItem` in `lib/cart-item.ts` exactly as C4 specifies, for SWHR3-T-0071 to move.
2. Also export `CartView` and `CartLine` types from `lib/cart-item.ts` per C9.
3. Create the client mirror `src/types/cart.ts` (`CartView`, `CartLine`) and re-export it from `src/types/index.ts`, as `src/types/order-approval.ts` is.
4. Test in `lib/cart-item.test.ts`: all seven fields are carried from the catalogue item and quantity; quantity 5 at 1999 cents gives `cartItemTotalCost` 99.95 and `cartItemTotalCostCents` 9995; `cartItemUnitCost` gives 19.99.

## File/module ownership

- `lib/cart-item.ts, lib/cart-item.test.ts`
- `src/types/cart.ts`
- `src/types/index.ts` (re-export line only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 10 checkboxes tagged with this key are stamped when it merges.
