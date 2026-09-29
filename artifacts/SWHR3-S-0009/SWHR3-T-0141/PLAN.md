---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0141
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0141/tdd-test-result.md]
---

# Plan — SWHR3-T-0141: Form Submission Handler — parseInventoryForm (qty*/item* fields, skip invalid rows)

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 14. Requirement(s): "Inventory update page", "Inventory quantity update validation". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0138, SWHR3-T-0128.

## Objective

The flat form body becomes a list of updates. Only ticked rows with a whole-number, non-negative quantity are kept, and everything else is skipped silently (D7, C6).

## Steps

1. Create `lib/supplier-request.ts` per C6. A row is `item_<id>` ticked plus `qty_<id>` trimmed, matching `^\d+$`. Unticked rows, empty, negative (`-3`), decimal (`2.5`) or non-numeric values, and ticked rows with no quantity are all dropped without error. A non-object body gives `[]`.
2. Test in `lib/supplier-request.test.ts`, table-driven: `{ qty_EST-1: '12', item_EST-1: 'on', qty_EST-2: '-3', item_EST-2: 'on', qty_EST-3: '', item_EST-3: true, qty_EST-4: '7' }` gives exactly `[{ itemId: 'EST-1', quantity: 12 }]`; `'0'` ticked is kept.

## File/module ownership

- `lib/supplier-request.ts, lib/supplier-request.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 14 checkboxes tagged with this key are stamped when it merges.
