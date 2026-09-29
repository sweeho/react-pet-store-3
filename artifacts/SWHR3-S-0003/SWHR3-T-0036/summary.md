---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0036
branch: vortex/feat/SWHR3-T-0036-order-status-management-orders-table-acc-846c3b10
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0036/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0036: Order Status Management — orders table, account role, status rules and orders service

## What changed

Added the `orders` table and `accounts.role` in one migration, the four-status vocabulary and its
transition rule, two new typed errors, and `lib/orders.ts` (grouped read, single-order status
update) — the foundation every other ticket in this change builds on. No UI: this ticket touches
nothing a user sees (PLAN.md).

## Files

- `db/schema.ts` — `orders` table (D1) and `accounts.role` (D3), per C1.
- `db/client.ts` — registers `orders` in the drizzle schema object.
- `drizzle/0003_pale_albert_cleary.sql` + `drizzle/meta/0003_snapshot.json`, `_journal.json` — the migration.
- `lib/errors.ts` — `InvalidTransitionError` (409, `INVALID_TRANSITION`), `ForbiddenError` (403, `FORBIDDEN`), per C7.
- `lib/order-status.ts` (new) — `ORDER_STATUSES`, `ASSIGNABLE_STATUSES`, `isOrderStatus`, `isAssignableStatus`, `assertTransition`, per D2/C2.
- `src/constants/order-status.ts` (new) — client mirror of the two arrays.
- `tsconfig.node.json` — added `src/constants/order-status.ts` to `include`.
- `lib/orders.ts` (new) — `OrderRow`, `listOrdersByStatus`, `getOrdersGroupedByStatus`, `updateOrderStatus`, per C3.
- `lib/errors.test.ts`, `lib/order-status.test.ts`, `src/constants/order-status.test.ts`, `lib/orders.test.ts` — new/extended tests.

## AC coverage

- AC-1 (Order status enumeration — orders queryable by status) — `lib/orders.ts`'s `getOrdersGroupedByStatus`, covered by `lib/orders.test.ts › getOrdersGroupedByStatus` (`SWHR3-C-0002`, `SWHR3-C-0003`).
- AC-2 / Contract C1 (migration: `orders` + `accounts.role`, existing accounts read back `"customer"`) — `db/schema.ts`, `drizzle/0003_*`, covered by `lib/orders.test.ts › accounts.role (C1)`.
- AC-3 / Contract C2 (`ORDER_STATUSES`, `ASSIGNABLE_STATUSES`, `assertTransition`, client mirror + parity) — `lib/order-status.ts`, `src/constants/order-status.ts`, covered by `lib/order-status.test.ts` and `src/constants/order-status.test.ts`.
- AC-4 (only `PENDING→APPROVED`/`PENDING→DENIED` legal; every other pair throws `InvalidTransitionError` naming the order id and current status) — `lib/order-status.ts`'s `assertTransition`, covered by `lib/order-status.test.ts › assertTransition` (all 16 from/to pairs).
- AC-5 / Contract C3 (`getOrdersGroupedByStatus` always four keys, sorted ascending; `updateOrderStatus` throws `NotFoundError`/`InvalidTransitionError`, row unchanged) — `lib/orders.ts`, covered by `lib/orders.test.ts › listOrdersByStatus`, `› getOrdersGroupedByStatus`, `› updateOrderStatus`.
- AC-6 / Contract C7 (`InvalidTransitionError`, `ForbiddenError`, `toHttpError` mapping) — `lib/errors.ts`, covered by `lib/errors.test.ts`.

## Verification

```
$ bun run verify
Test Files  51 passed (51)
     Tests  309 passed (309)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is not installed in this
container and directs engineer containers to `bun run verify` instead (E2E runs in the QA-phase/CI
containers). This ticket adds no UI and no E2E spec, so nothing was skipped. Full detail and the
red→green proof: `tdd-test-result.md`.

## Notes

- `status` is stored as plain `text` in `db/schema.ts` (no `$type`/CHECK), keeping `db/schema.ts`
  free of any `lib/` import; `lib/orders.ts` is the sole writer and narrows the column with a single
  commented type assertion where it reads it back.
- `getOrdersGroupedByStatus`/`listOrdersByStatus` scan every order in the db (an admin sees every
  account's orders, not just one) — `lib/orders.test.ts` clears the `orders` table in a top-level
  `beforeEach` so its tests stay independent of each other inside the shared in-memory db.
- `a2a_run_tests` refused to record the two platform-linked cases (`SWHR3-C-0002`, `SWHR3-C-0003`):
  this project's `.vortex/config.yaml` has no `testEvidence` block, so it directed use of the
  `TDD-RESULT` marker instead — `tdd-test-result.md` carries both.
