---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0040
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0040/tdd-test-result.md]
---

# Plan — SWHR3-T-0040: Business Delegate Implementation — updateOrders batch service

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`lib/order-approval.ts` `updateOrders` applies a whole OrderApproval atomically and logs one line per successful commit.

## Steps

1. Create `lib/order-approval.ts` with the C4 types and `updateOrders(approval)` running every change through `updateOrderStatus` (C3) inside one `withTransaction` (`design.md` D6).
2. Let typed errors propagate unchanged, so the route can map them.
3. After the transaction commits, log `order-approval: committed N (id→STATUS, …)` with no user name (D7, SD12).
4. Tests against the in-memory db: all succeed; one unknown id; one non-PENDING row; the log line is written once on success and not at all on failure (spy on `console.info`).

## File/module ownership

- `lib/order-approval.ts, lib/order-approval.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4 — the ticket's acceptance criteria, each proven by a test named for it.
