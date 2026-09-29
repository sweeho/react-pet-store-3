---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0143
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0143/tdd-test-result.md]
---

# Plan — SWHR3-T-0143: Error Handling and Logging — fulfilment attempt records, unable-to-fulfil marking, inventory before/after logs

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 16. Requirement(s): "Inventory validation for order fulfillment". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0136, SWHR3-T-0138.

## Objective

Every fulfilment attempt is recorded, including UNABLE with its short items. Portal activity is logged with inventory before/after values (D10).

## Steps

1. In `lib/supplier-fulfilment.ts`, insert a `supplier_fulfilment_attempts` row per attempt: `FULFILLED`, or `UNABLE` with `detail` = `shortItems` JSON. Log `supplier: PO <id> <result>` (with short items for UNABLE).
2. In `lib/inventory-update.ts`, log `supplier: inventory <itemId> <before> -> <after>` per update and one summary line per call, and log an unexpected failure with context before rethrowing.
3. Tests (extend `lib/supplier-fulfilment.test.ts` and `lib/inventory-update.test.ts`, spying on `console`): a short PO leaves inventory unchanged, the PO PENDING, and one UNABLE attempt row naming the short item with needed and available; a fulfilled PO records FULFILLED; an update logs before and after values.

## File/module ownership

- `lib/supplier-fulfilment.ts, lib/supplier-fulfilment.test.ts` (attempt records and logs only)
- `lib/inventory-update.ts, lib/inventory-update.test.ts` (logs only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 16 checkboxes tagged with this key are stamped when it merges.
