---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0074
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0074/tdd-test-result.md]
---

# Plan — SWHR3-T-0074: Integration Testing — end-to-end cart workflow and transaction rollback

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 17. Requirement(s): "Shopping cart workflow". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0072.

## Objective

A Playwright spec drives the whole cart journey in a real browser against a seeded catalogue.

## Steps

1. Create `e2e/cart.spec.ts`. In `beforeAll`, seed the catalogue by spawning `bun db/seed-catalog.ts`, the same way `e2e/order-approval.spec.ts` spawns `db/seed-orders.ts`.
2. Each test uses its own browser context, so it has its own `petstore_cart` cookie. It adds items through `page.request.post('/api/cart', ...)`, which shares the context's cookies, because there is no catalogue UI yet.
3. Cover this journey: visit `/cart` empty and see the empty message; add two items (one with the default quantity, one with quantity 3) and see both rows, their line totals and the subtotal; change a quantity and click Update Cart to see new totals; set a quantity to 0 or non-numeric, update, and see the row gone; click Remove on the last item and see the empty message; add again, click Check Out and land on `/checkout` with the order-entry heading; empty the cart via `DELETE /api/cart`, visit `/checkout`, and see the empty-cart checkout error.
4. Run the spec locally at least once before committing.

## File/module ownership

- `e2e/cart.spec.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

The idea carries no design blocks, so there is nothing under `artifacts/SWHR3-S-0005/design/`. The visible contract is the delta spec's two display requirements plus the PRD's fixed-width desktop non-goal. Build from the existing primitives in `src/components/ui/` (`Table`, `Input`, `Button`, `Alert`) and the tokens in `src/index.css`, the way `src/components/admin/orders-table.tsx` does.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 17 checkboxes tagged with this key are stamped when it merges.
