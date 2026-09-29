---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0131
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0131/tdd-test-result.md]
---

# Plan — SWHR3-T-0131: Address Entity Bean — supplier PO delivery address

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 4. Requirement(s): "Address entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0129.

## Objective

A supplier PO contact's delivery address (lines 1–2, city, state or province, postal code, country) can be written and read 1:1 with the contact (D4, C3).

## Steps

1. Create `lib/supplier-order-addresses.ts` per C3: `insertSupplierAddress` requires the contact to exist, so the foreign key holds, and `getSupplierAddress`.
2. Test in `lib/supplier-order-addresses.test.ts`: all six fields round-trip with a null `address2`; inserting without a contact fails.

## File/module ownership

- `lib/supplier-order-addresses.ts, lib/supplier-order-addresses.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 4 checkboxes tagged with this key are stamped when it merges.
