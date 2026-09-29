---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0039
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0039/tdd-test-result.md]
---

# Plan — SWHR3-T-0039: Server Communication Protocol — POST /api/admin/orders/status commit route

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`POST /api/admin/orders/status` accepts one `OrderApprovalRequest`, commits it through `updateOrders`, and answers the C6 success body or the standard error body.

## Steps

1. Create `routes/api/admin/orders/status.post.ts`, mirroring `routes/api/customers/me.put.ts`: `readBody` → `parseOrderApprovalRequest` (C5, SWHR3-T-0045) → `updateOrders` (C4, SWHR3-T-0040) → `{ type: "UPDATEORDERS", status: "SUCCESS", updated }`; wrap in `try` / `toHttpError` (`design.md` D5, SD3, SD5).
2. Authorization is already enforced by `middleware/auth.ts` for `/api/admin/**` (D4); the handler does not re-check the role.
3. Route integration tests with a real `H3Event` against the in-memory db (copy `routes/api/customers/me.put.test.ts`): success, wrong `requestType` (422), unknown id (404), non-PENDING (409), and a mixed batch that leaves every order unchanged.

## File/module ownership

- `routes/api/admin/orders/status.post.ts, status.post.test.ts`

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
