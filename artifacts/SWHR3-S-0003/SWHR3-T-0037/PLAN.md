---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0037
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0037/tdd-test-result.md]
---

# Plan — SWHR3-T-0037: Rich Client UI — Orders approval table with Table, Badge and Dialog primitives

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

`Table`, `Badge` and `Dialog` primitives exist in `src/components/ui/`, and `OrdersTable` renders a sortable, selectable order queue whose editable mode stages APPROVED/DENIED decisions through callbacks, matching the pending-queue mockup.

## Steps

1. Add `Table` (Table/Header/Body/Row/Head/Cell, styled native elements), `Badge` (cva variants: pending, approved, denied, completed, staged) and `Dialog` (wrapping `@headlessui/react` `Dialog`, already a dependency) following the primitive pattern in DESIGN.md §Components; export them from `src/components/ui/index.ts`.
2. Build `OrdersTable` with the props in `design.md` C12. Columns and copy follow D10 and the mockup; the status select offers only `ASSIGNABLE_STATUSES` from `src/constants/order-status.ts` (SD9); a staged row shows its staged status and a "staged" marker.
3. Header buttons call `onSortChange` and set `aria-sort`; the component does not sort rows itself (sorting is `src/utils/sort-orders.ts`, SWHR3-T-0041).
4. Format amounts from `totalCents` as `$1,245.00` and dates as `21 Sep 2026, 16:40` inside the component file.
5. Component tests: one per primitive; `OrdersTable` covers editable vs read-only, approve-selected, deny-selected on several rows, the select's two options, and header sort callbacks.

## File/module ownership

- `src/components/ui/table.tsx, table.test.tsx`
- `src/components/ui/badge.tsx, badge-variants.ts, badge.test.tsx`
- `src/components/ui/dialog.tsx, dialog.test.tsx`
- `src/components/ui/index.ts`
- `src/components/admin/orders-table.tsx, orders-table.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

`artifacts/SWHR3-S-0003/design/mockup-order-review-pending-queue-with-staged-d.html` (primary), `artifacts/SWHR3-S-0003/design/wireframe-order-review-pending-queue-with-staged-d.html`, `artifacts/SWHR3-S-0003/design/mockup-decided-orders-queue-read-only.html` (read-only mode). Index: `artifacts/SWHR3-S-0003/design/MANIFEST.md`.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5
- AC-6
- AC-7 — the ticket's acceptance criteria, each proven by a test named for it.
