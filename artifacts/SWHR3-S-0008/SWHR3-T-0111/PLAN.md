---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0111
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0111/tdd-test-result.md]
---

# Plan — SWHR3-T-0111: Line Item Management — line items and order total through processOrder

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 3. Requirement(s): "Line item creation and aggregation", "Order total calculation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0117.

## Objective

It is proven that every cart line becomes a `line_items` row with product, item, quantity and unit price, and that the order total is the sum of the line totals (SD9, SD10).

## Steps

1. Create `lib/order-processing.lines.test.ts`:
   - A cart of 2 × 1999 and 1 × 550 gives two `line_items`, numbered 1–2, with `productId`, `itemId`, `quantity` and `unitPriceCents` from the catalogue.
   - `total_cents` is 4548.
   - The outbox payload's `totalCents` and line totals agree with it.
2. Change no production file. If a case fails, stop and raise it to planning.

## File/module ownership

- `lib/order-processing.lines.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 3 checkboxes tagged with this key are stamped when it merges.
