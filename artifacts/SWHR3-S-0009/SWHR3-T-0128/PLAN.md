---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0128
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0128/tdd-test-result.md]
---

# Plan — SWHR3-T-0128: Supplier Portal Authentication — supplier role, /api/supplier prefix rule and grant script

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 1. Requirement(s): "Role-based supplier access control". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. No dependency.

## Objective

A `supplier` role exists. Every `/api/supplier/` path is refused to anyone without it, store administrators included, and operators can grant it (D1).

## Steps

1. Extend `AccountRole` in `lib/roles.ts` with `"supplier"`.
2. Add `SUPPLIER_API_PREFIX = "/api/supplier/"` and `isSupplierApiPath` to `lib/protected-resources.ts`.
3. In `middleware/auth.ts`, a supplier path answers 401 without a session (the same messages as admin) and 403 `FORBIDDEN` ("Supplier administrator credentials required") unless `getAccountRole` returns `supplier`. Admin and customer rules are unchanged.
4. Create `db/grant-supplier.ts`, mirroring `db/grant-admin.ts`, and add the `supplier:grant` script to `package.json`.
5. Tests extend `lib/roles.test.ts`, `lib/protected-resources.test.ts` and `middleware/auth.test.ts`. A signed-out request to `/api/supplier/inventory` gets 401; a customer and an admin get 403; a supplier passes; a supplier gets 403 on `/api/admin/orders`; a revoked role applies on the next request.

## File/module ownership

- `lib/roles.ts, lib/roles.test.ts`
- `lib/protected-resources.ts, lib/protected-resources.test.ts`
- `middleware/auth.ts, middleware/auth.test.ts`
- `db/grant-supplier.ts`
- `package.json` (the supplier:grant script line only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 1 checkboxes tagged with this key are stamped when it merges.
