---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0122
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0122/tdd-test-result.md]
---

# Plan — SWHR3-T-0122: Testing — end-to-end order workflow, decline path and concurrent processing

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 14. Requirement(s): "Order creation with validation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0109, SWHR3-T-0110, SWHR3-T-0111, SWHR3-T-0118, SWHR3-T-0119, SWHR3-T-0121.

## Objective

The whole workflow is driven in a real browser, plus the decline path, and concurrent placements are proven safe.

## Steps

1. Create `e2e/order-workflow.spec.ts` as the other specs do: seed the catalogue, sign in a customer with a profile, fill the cart through the API. The journeys:
   - (a) Place an order in the browser and land on `/orders/<id>`.
   - (b) Run `db/seed-inventory.ts --all 10`, sign in as an administrator (granted with the `admin:grant` script), approve the order on `/admin/orders`, then run `db/ship-supplier-po.ts` for its PO. The order shows in the Completed tab.
   - (c) Pay with the decline test card and see the declined alert. No confirmation page, and the cart is still full.
2. Create `lib/order-processing.concurrency.test.ts`: 10 `processOrder` calls for 10 carts via `Promise.all` give 10 distinct orders, each with one payment and one outbox row.
3. Run the E2E spec locally at least once; if Chromium is unavailable, say so in the work log.

## File/module ownership

- `e2e/order-workflow.spec.ts`
- `lib/order-processing.concurrency.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 14 checkboxes tagged with this key are stamped when it merges.
