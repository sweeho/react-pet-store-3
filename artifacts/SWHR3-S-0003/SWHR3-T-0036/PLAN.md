---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0036
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0036/tdd-test-result.md]
---

# Plan — SWHR3-T-0036: Order Status Management — orders table, account role, status rules and orders service

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

The `orders` table and `accounts.role` exist in one committed migration; the four-status vocabulary, its transition rule and the two new typed errors are importable from `lib/`; `lib/orders.ts` reads orders grouped by status and changes one order's status under the transition rule. Every later ticket codes against these contracts.

## Steps

1. Add `orders` and `accounts.role` to `db/schema.ts` exactly as `design.md` D1 and D3 / C1 specify; register `orders` in the drizzle schema object in `db/client.ts`; generate the migration and commit it with its meta snapshot.
2. Add `InvalidTransitionError` and `ForbiddenError` to `lib/errors.ts` per C7, with tests that `toHttpError` maps each.
3. Create `lib/order-status.ts` per D2 / C2, with a table-driven test covering all 16 from→to pairs.
4. Create the client mirror `src/constants/order-status.ts`, add it to `tsconfig.node.json` `include` (the same way `src/constants/auth.ts` is), and a parity test that imports both.
5. Create `lib/orders.ts` per C3: `listOrdersByStatus`, `getOrdersGroupedByStatus`, `updateOrderStatus(tx, id, to)`. `updateOrderStatus` re-reads the row through `tx`, throws `NotFoundError` / `InvalidTransitionError`, and updates `status` + `updatedAt` with a `WHERE status = 'PENDING'` guard.
6. Test `lib/orders.ts` against the in-memory db, inserting fixture accounts and orders directly.

## File/module ownership

- `db/schema.ts`
- `db/client.ts` (schema object registration only)
- `drizzle/0003_*.sql, drizzle/meta/*`
- `lib/errors.ts, lib/errors.test.ts`
- `lib/order-status.ts, lib/order-status.test.ts`
- `lib/orders.ts, lib/orders.test.ts`
- `src/constants/order-status.ts, src/constants/order-status.test.ts`
- `tsconfig.node.json` (include entry only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5
- AC-6 — the ticket's acceptance criteria, each proven by a test named for it.
