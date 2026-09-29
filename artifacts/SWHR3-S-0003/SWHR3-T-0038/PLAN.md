---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0038
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0038/tdd-test-result.md]
---

# Plan — SWHR3-T-0038: Client-Side Change Tracking — staged decisions hook and order-approval client types

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`useStagedDecisions` tracks uncommitted APPROVED/DENIED decisions by order id and packages them into one `OrderApprovalRequest`; the client order-approval types exist for every other client file to import.

## Steps

1. Create `src/types/order-approval.ts` per `design.md` C9, importing the status types from `src/constants/order-status.ts`.
2. Create `src/hooks/use-staged-decisions.ts` per C10 and D8: state is a `Map`; `stage(ids, status)` sets or replaces; `toRequest()` returns `{ requestType: "UPDATESTATUS", changes }` sorted by `orderId` (D5, SD2).
3. Hook tests with `renderHook`: stage/replace/unstage/clear, count, `hasUncommittedChanges`, and the exact `toRequest()` payload.

## File/module ownership

- `src/types/order-approval.ts`
- `src/hooks/use-staged-decisions.ts, use-staged-decisions.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5 — the ticket's acceptance criteria, each proven by a test named for it.
