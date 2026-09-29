---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0075
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0075/tdd-test-result.md]
---

# Plan — SWHR3-T-0075: Error Handling — invalid input, catalogue failure, missing cookie and concurrent adds

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 18. Requirement(s): "CartHTMLAction NumberFormatException handling". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0069.

## Objective

The cart's failure paths are proven at the HTTP level: bad quantities remove, missing ids are refused, catalogue gaps degrade, no cookie reads empty, and concurrent adds stay one row.

## Steps

1. Create `routes/api/cart/errors.test.ts` with a real `H3Event` through both middlewares. `PUT` `itemQuantity_<id>` = `"abc"`, `"2.5"` and `""` each removes that item and leaves others. `POST` without `itemId` answers 422 `VALIDATION_FAILED` with `fieldErrors.itemId`, and `DELETE /api/cart/%20` answers 422 too. `POST` of an unknown itemId answers 404 `CATALOG_ITEM_NOT_FOUND`.
2. In the same file: a cart row whose catalogue item was deleted is omitted from `GET` while the others show (D4). `GET` with no cookie answers an empty `CartView` and sets no cookie; `GET` with a malformed cookie reads empty (C8, SD11). Twenty concurrent `addItem` calls for one item on one token leave exactly one row (SD12).
3. If a case exposes a defect, fix it in `lib/cart-request.ts` or `lib/cart.ts` only, and name the fix in the work log.

## File/module ownership

- `routes/api/cart/errors.test.ts`
- `lib/cart-request.ts, lib/cart.ts` (defect fixes only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 18 checkboxes tagged with this key are stamped when it merges.
