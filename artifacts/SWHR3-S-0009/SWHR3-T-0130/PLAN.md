---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0130
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0130/tdd-test-result.md]
---

# Plan — SWHR3-T-0130: Contact Information Entity — supplier PO delivery contact

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 3. Requirement(s): "Contact information entity". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0129.

## Objective

A supplier PO's delivery contact (given name, family name, email, telephone) can be written and read 1:1 with its PO (D4, C3).

## Steps

1. Create `lib/supplier-order-contacts.ts` per C3: `insertSupplierContact` and `getSupplierContact`. The latter throws `NotFoundError` when there is no contact.
2. Test in `lib/supplier-order-contacts.test.ts`: all four fields round-trip; a second insert for the same PO fails (1:1).

## File/module ownership

- `lib/supplier-order-contacts.ts, lib/supplier-order-contacts.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 3 checkboxes tagged with this key are stamped when it merges.
