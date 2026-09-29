---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0144
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0144/tdd-test-result.md]
---

# Plan — SWHR3-T-0144: Supplier Portal Configuration — supplier shell, sign-in, access-denied page, guard and client binding

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 17. Requirement(s): "Inventory display screen". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0134, SWHR3-T-0135, SWHR3-T-0128.

## Objective

The supplier area has its own shell and sign-in. A signed-in account without the supplier role sees "Access denied", and the client has a typed binding for the supplier API (D1, C11).

## Steps

1. Create `src/constants/supplier.ts`, `src/types/supplier.ts` (a parity test against `lib/inventory.ts` `InventoryRow`, the way the checkout mirror does; add the file to `tsconfig.node.json` include as that precedent does) and `src/utils/supplier-api.ts` (+ test).
2. Create `src/components/supplier/supplier-shell.tsx` (masthead, user name, "Supplier administrator" label, Sign out) and `src/components/supplier/require-supplier.tsx`, modelled on `RequireAdmin`. Signed out goes to `/supplier/signin?redirect=…`. A non-supplier session renders the access-denied content with "Sign in as a different user", which signs out and goes to `/supplier/signin`. Each has a test.
3. Create `src/pages/supplier/signin.tsx` (+ test), modelled on `src/pages/admin/signin.tsx`. After sign-in it checks the role through `GET /api/session`; a non-supplier sees the access-denied content.
4. Tests: a customer and an admin each see "Access denied" and never the inventory; a supplier reaches the children; sign-in with a supplier account lands on `/supplier`.

## File/module ownership

- `src/constants/supplier.ts`
- `src/types/supplier.ts` (+ parity test)
- `tsconfig.node.json` (include entry only)
- `src/utils/supplier-api.ts, src/utils/supplier-api.test.ts`
- `src/components/supplier/supplier-shell.tsx, src/components/supplier/require-supplier.tsx` (+ tests)
- `src/pages/supplier/signin.tsx, src/pages/supplier/signin.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build `artifacts/SWHR3-S-0009/design/mockup-supplier-sign-in.html` ("Pet Store Supplier", "Sign in to manage inventory.", Username, Password, Sign in, "Supplier accounts are issued by the store administrator."). Also build `artifacts/SWHR3-S-0009/design/mockup-inventory-access-denied.html` ("Access denied", its two explanation paragraphs, and "Sign in as a different user"). The shared masthead shows "Pet Store Supplier", the user's name, the "Supplier administrator" label and Sign out. The wireframes show structure.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 17 checkboxes tagged with this key are stamped when it merges.
