---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0041
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0041/tdd-test-result.md]
---

# Plan — SWHR3-T-0041: Data Retrieval and Filtering — GET /api/admin/orders and client-side order sorting

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`GET /api/admin/orders` returns all four status groups in one response, and `sortOrders` sorts rows by any column for the queue.

## Steps

1. Create `routes/api/admin/orders/index.get.ts` returning `{ orders: getOrdersGroupedByStatus() }` (`design.md` C3, C6), wrapped in `toHttpError`.
2. Route test with a real `H3Event`: seeded rows in several statuses come back grouped; an empty db returns four empty arrays.
3. Create `src/utils/sort-orders.ts`: `sortOrders(rows, { column, direction })` per the ticket criteria; import by path, not through `src/utils/index.ts`.
4. Unit tests for each column, both directions, tie-break by id, and no mutation of the input.

## File/module ownership

- `routes/api/admin/orders/index.get.ts, index.get.test.ts`
- `src/utils/sort-orders.ts, sort-orders.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it.
