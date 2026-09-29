---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0129
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0129/tdd-test-result.md]
---

# Plan — SWHR3-T-0129: Supplier Order Entity Bean — migration 0007, PO status vocabulary and supplier-side tables

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 2. Requirement(s): "Supplier order entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency.

## Objective

Migration 0007 re-models supplier PO statuses to PENDING/PROCESSING/COMPLETED and adds the supplier-side tables. `lib/supplier-order-status.ts` fixes the lifecycle (D2, C1, C2).

## Steps

1. Edit `db/schema.ts` per C1: the PO status default becomes `PENDING`, and add `supplierPoContacts`, `supplierPoAddresses`, `supplierInvoices` and `supplierFulfilmentAttempts`. Register the new tables in `db/client.ts`.
2. Generate migration `0007`. In the generated SQL, add the data update `OPEN`→`PROCESSING` and `SHIPPED`→`COMPLETED` for existing rows. Commit it with its meta snapshot.
3. Create `lib/supplier-order-status.ts` per C2.
4. Keep the tree green by replacing the status literals only, with no behaviour change. In `lib/supplier-pos.ts`, `createSupplierPOs` writes `PROCESSING` (still created after reservation until SWHR3-T-0139 and SWHR3-T-0137 change that) and `markPoShipped` moves `PROCESSING`→`COMPLETED`. Make the matching literal changes in `lib/process-manager.ts` (`every(p => p.status === 'COMPLETED')`) and their two test files.
5. Test in `lib/supplier-order-status.test.ts` (transition table) and a migration test (`lib/supplier-order-status.migration.test.ts`): a PO inserted as `OPEN` before the data update reads `PROCESSING` after it.

## File/module ownership

- `db/schema.ts`
- `db/client.ts` (schema registration only)
- `drizzle/0007_*.sql, drizzle/meta/*`
- `lib/supplier-order-status.ts, lib/supplier-order-status.test.ts, lib/supplier-order-status.migration.test.ts`
- `lib/supplier-pos.ts, lib/supplier-pos.test.ts, lib/process-manager.ts, lib/process-manager.test.ts` (status literals only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 2 checkboxes tagged with this key are stamped when it merges.
