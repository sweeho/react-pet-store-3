---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0115
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0115/tdd-test-result.md]
---

# Plan — SWHR3-T-0115: Inventory Integration — all-or-nothing reservation and inventory seed script

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 7. Requirement(s): "Inventory reservation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0120.

## Objective

`reserveInventory` decrements stock and records reservations for every line, or changes nothing (D5, C6).

## Steps

1. Create `lib/inventory.ts` per C6. `reserveInventory` checks every line's `inventory.quantity` (a missing row counts as 0) in `tx`. If all are covered it decrements each item, inserts `inventory_reservations` and returns true; otherwise it writes nothing and returns false. `setInventory` upserts.
2. Create `db/seed-inventory.ts`, mirroring `db/seed-orders.ts`: `--item <id> --quantity <n>` or `--all <n>` for every catalogue item. It prints JSON on its last line.
3. Test in `lib/inventory.test.ts`: stock 5 and 3, a reservation of 2 and 3 gives 3 and 0 with two reservation rows; a reservation of 2 and 4 returns false with both quantities and no rows unchanged; an item with no inventory row returns false.

## File/module ownership

- `lib/inventory.ts, lib/inventory.test.ts`
- `db/seed-inventory.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 7 checkboxes tagged with this key are stamped when it merges.
