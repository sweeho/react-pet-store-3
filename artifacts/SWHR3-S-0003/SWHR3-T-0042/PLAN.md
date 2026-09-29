---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0042
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0042/tdd-test-result.md]
---

# Plan — SWHR3-T-0042: Uncommitted Changes Detection — refresh control with discard warning

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

Refresh on `/admin/orders` reloads immediately when nothing is staged, and otherwise asks before discarding the staged decisions, as the warning mockup shows.

## Steps

1. Create `src/components/admin/refresh-orders-control.tsx` with props `{ staged, onRefresh, onDiscard }`, using the `Dialog` primitive (`design.md` D11, D8, SD7). Copy: title "Discard N uncommitted changes?", body listing `id → STATUS`, buttons "Cancel — keep my changes" and "Refresh anyway".
2. In `src/pages/admin/orders.tsx` (built by SWHR3-T-0046), replace the plain Refresh button with the control; "Refresh anyway" clears the staged decisions and then reloads through `fetchOrdersByStatus`.
3. Component tests for no-staged (no dialog), cancel (staged kept, no fetch) and confirm (cleared, one fetch); extend the page test with the same three cases.

## File/module ownership

- `src/components/admin/refresh-orders-control.tsx, refresh-orders-control.test.tsx`
- `src/pages/admin/orders.tsx, src/pages/admin/orders.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

`artifacts/SWHR3-S-0003/design/mockup-uncommitted-changes-warning-on-refresh.html` (primary), `artifacts/SWHR3-S-0003/design/wireframe-uncommitted-changes-warning-on-refresh.html`. Index: `artifacts/SWHR3-S-0003/design/MANIFEST.md`.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5 — the ticket's acceptance criteria, each proven by a test named for it.
