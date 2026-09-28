---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0046
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0046/tdd-test-result.md]
---

# Plan — SWHR3-T-0046: Integration with Admin Interface — /admin shell, administrator gate, home and four-tab order review page

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

An administrator reaches `/admin`, sees the four status counts, opens `/admin/orders`, and works the four-tab queue with staging and commit; anyone else is sent to `/admin/signin` and, if signed in without the role, told so.

## Steps

1. Create `RequireAdmin` (reads `useSession`, including `role`) and `AdminShell` (header, Orders nav, user name + ADMINISTRATOR `Badge`, the existing `SignOutButton`), wrapping every admin page except sign-in (`design.md` D9, SD10). No change to `src/main.tsx` or `PROTECTED_PAGE_PATHS`.
2. Create `/admin/signin`: a form posting to the existing `POST /api/auth/signin`, then re-reading the session; admin → redirect target; non-admin → the not-an-administrator state from the mockup, without the supplier note (SD15).
3. Create `/admin`: counts from `fetchOrdersByStatus` and a link to the queue; no Reports link (SD14).
4. Create `/admin/orders`: four tabs with counts (D10); Pending wires `OrdersTable` + `useStagedDecisions` + `sortOrders` + `CommitDecisionsDialog`; other tabs are read-only `OrdersTable`s; a plain Refresh button that reloads (SWHR3-T-0042 replaces it). A successful commit clears staging and reloads (D11).
5. Page and component tests with mocked `fetch`, one per page plus the shell and the gate.

## File/module ownership

- `src/components/admin/admin-shell.tsx, admin-shell.test.tsx`
- `src/components/admin/require-admin.tsx, require-admin.test.tsx`
- `src/pages/admin/index.tsx, index.test.tsx`
- `src/pages/admin/orders.tsx, orders.test.tsx`
- `src/pages/admin/signin.tsx, signin.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

`artifacts/SWHR3-S-0003/design/mockup-admin-home.html`, `artifacts/SWHR3-S-0003/design/mockup-order-review-pending-queue-with-staged-d.html`, `artifacts/SWHR3-S-0003/design/mockup-decided-orders-queue-read-only.html`, `artifacts/SWHR3-S-0003/design/mockup-administrator-sign-in-required.html`, and the matching `wireframe-*.html` (the four-tab layout comes from the wireframe, D10). Index: `artifacts/SWHR3-S-0003/design/MANIFEST.md`.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5 — the ticket's acceptance criteria, each proven by a test named for it.
