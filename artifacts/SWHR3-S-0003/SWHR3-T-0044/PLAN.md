---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0044
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0044/tdd-test-result.md]
---

# Plan — SWHR3-T-0044: EJB Transaction Management — immediate-mode transactions and batch atomicity

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`withTransaction` supports an explicit transaction behavior, `updateOrders` uses immediate mode, and a dedicated suite proves batch atomicity and overlapping-batch safety.

## Steps

1. Extend `lib/transaction.ts` with the optional third `options` argument per `design.md` C8; pass `behavior` through to `db.transaction` only for a standalone call (with `outer` it still reuses the outer transaction).
2. In `lib/order-approval.ts`, pass `{ behavior: "immediate" }` (D6). Change nothing else in that file.
3. Create `lib/order-approval.atomicity.test.ts`: a three-order batch commits together; a three-order batch whose third change fails leaves all three unchanged; two sequential batches on the same order (the second fails with `INVALID_TRANSITION` and persists nothing).
4. Add `lib/transaction.test.ts` cases for the new option without altering existing cases.

## File/module ownership

- `lib/transaction.ts, lib/transaction.test.ts`
- `lib/order-approval.ts` (behavior argument only)
- `lib/order-approval.atomicity.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4 — the ticket's acceptance criteria, each proven by a test named for it.
