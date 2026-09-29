---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
ticket: SWHR3-T-0134
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [openspec/changes/swhr3-i-0007-supplier-portal-and-invento/design.md]
downstream: [artifacts/SWHR3-S-0009/SWHR3-T-0134/tdd-test-result.md]
---

# Plan — SWHR3-T-0134: Request Processing Servlet — POST /api/supplier/inventory route

Change: `swhr3-i-0007-supplier-portal-and-invento`, tasks.md group 7. Requirement(s): "ServiceLocator pattern integration". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0009)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0136.

## Objective

`POST /api/supplier/inventory` accepts the form's JSON body, applies it atomically and answers per D7 and C10.

## Steps

1. Create `routes/api/supplier/inventory.post.ts`: `readJsonBody`, then `parseInventoryForm`, `applyInventoryUpdate` and `getInventory`. It answers 200 `{ updated, processedOrders, fulfilledOrders, inventory }` and converts errors with `toHttpError`. Role enforcement is the middleware's (SWHR3-T-0128); the handler does not re-check.
2. Route test `routes/api/supplier/inventory.post.test.ts` (real `H3Event` through `middleware/auth.ts`), signed in as a supplier: two ticked valid rows and one unticked row update exactly two items; the response lists them; a non-JSON body gets 415; a customer gets 403.
3. SD8: add `lib/supplier-portal.modules.test.ts`, proving the portal's collaborators resolve by static import (`lib/inventory`, `lib/inventory-update`, `lib/supplier-fulfilment`, `lib/invoices`, `lib/supplier-orders`).

## File/module ownership

- `routes/api/supplier/inventory.post.ts, routes/api/supplier/inventory.post.test.ts`
- `lib/supplier-portal.modules.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The sprint's designs are under `artifacts/SWHR3-S-0009/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 7 checkboxes tagged with this key are stamped when it merges.
