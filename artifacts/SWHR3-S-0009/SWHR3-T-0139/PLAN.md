---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0139
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0139/tdd-test-result.md]
---

# Plan — SWHR3-T-0139: Supplier Order Creation — PENDING POs with delivery contact and address copied from SHIP_TO

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 12. Requirement(s): "Supplier order entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0132, SWHR3-T-0133.

## Objective

`createSupplierPOs` creates each PO as PENDING with its creation time, and copies the order's SHIP_TO snapshot into the PO's contact and address (D2, D4).

## Steps

1. Change `lib/supplier-pos.ts` `createSupplierPOs`. Status is `PENDING` and `createdAt` is `now` (poDate). For each PO it reads the order's `SHIP_TO` row from `order_contacts` and calls `insertSupplierContact` and `insertSupplierAddress`, mapping `telephoneNumber`→`telephone` and `address1/2` as they are. Grouping and delivery dates are unchanged.
2. Extend `lib/supplier-pos.test.ts`: a new PO has an integer id, `created_at` equal to the fixed `now`, and status PENDING; its contact and address match the order's shipping snapshot; two suppliers give two POs, each with its own contact.

## File/module ownership

- `lib/supplier-pos.ts, lib/supplier-pos.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 12 checkboxes tagged with this key are stamped when it merges.
