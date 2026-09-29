---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0135
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0135/tdd-test-result.md]
---

# Plan — SWHR3-T-0135: Inventory Display Handler — GET /api/supplier/inventory route

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 8. Requirement(s): "DisplayInventoryBean display logic". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0128, SWHR3-T-0133.

## Objective

`GET /api/supplier/inventory` returns every catalogue item with its current quantity to a supplier (C10).

## Steps

1. Create `routes/api/supplier/inventory.get.ts`, returning `{ items: getInventory() }`.
2. Route test `routes/api/supplier/inventory.get.test.ts`: with three catalogue items, two of them stocked, a supplier gets three rows in item order with the right quantities (0 for the unstocked one); a signed-out caller gets 401; an admin gets 403.

## File/module ownership

- `routes/api/supplier/inventory.get.ts, routes/api/supplier/inventory.get.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 8 checkboxes tagged with this key are stamped when it merges.
