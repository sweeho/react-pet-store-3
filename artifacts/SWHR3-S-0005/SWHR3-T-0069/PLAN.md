---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0069
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0069/tdd-test-result.md]
---

# Plan — SWHR3-T-0069: Web Tier Action Handler — cart request parsing and the /api/cart routes

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 12. Requirement(s): "Shopping cart HTML action". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0070.

## Objective

HTTP requests become `CartAction`s through `lib/cart-request.ts`, and the five `/api/cart` routes apply them and answer with the full `CartView`.

## Steps

1. Create `lib/cart-request.ts` per C6, mirroring `lib/order-approval-request.ts`. `parseQuantity` accepts an integer or a whole-number string (optional leading `-`), and anything else becomes 0 (SD4). A missing or blank itemId throws `ValidationError({ itemId })`.
2. Create the five routes of C9 under `routes/api/cart/`: `index.get.ts`, `index.post.ts`, `index.put.ts`, `[itemId].delete.ts`, `index.delete.ts`. Each reads `event.context.cartSession` (C8) and the locale via `resolveCartLocale` (C7), then parses and calls `applyCartAction` (C5). Each returns a `CartView` built from `getItems`, `getSubTotalCents` and `getCount`, and converts errors with `toHttpError` (D8, D9).
3. `POST` checks `getItem(itemId, locale)` first so an unknown item answers 404 `CATALOG_ITEM_NOT_FOUND` (D4). `GET` with no cart cookie answers an empty `CartView`.
4. Test `lib/cart-request.test.ts` (parsers, table-driven) and one `*.test.ts` per route beside it with a real `H3Event`, as `routes/api/users/index.get.test.ts` does.

## File/module ownership

- `lib/cart-request.ts, lib/cart-request.test.ts`
- `routes/api/cart/index.get.ts, index.post.ts, index.put.ts, [itemId].delete.ts, index.delete.ts and their *.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 12 checkboxes tagged with this key are stamped when it merges.
