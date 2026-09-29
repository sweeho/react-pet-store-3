---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0041
branch: vortex/feat/SWHR3-T-0041-data-retrieval-and-filtering-get-api-adm-8b18abc4
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0041/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0041: Data Retrieval and Filtering — GET /api/admin/orders and client-side order sorting

## What changed

Added `GET /api/admin/orders`, returning all four order status groups in one response, and
`sortOrders`, a pure client-side sort util (any column, either direction) that stands in for the
legacy TableSorter. No UI: this ticket touches nothing a user sees (PLAN.md).

## Files

- `routes/api/admin/orders/index.get.ts` (new) — returns `{ orders: getOrdersGroupedByStatus() }`, wrapped in `toHttpError`, per C3/C6.
- `routes/api/admin/orders/index.get.test.ts` (new) — integration test against a real `H3Event`.
- `src/utils/sort-orders.ts` (new) — `sortOrders(rows, { column, direction })`, per the ticket's sort criterion. Imported by path, not re-exported through `src/utils/index.ts`.
- `src/utils/sort-orders.test.ts` (new) — unit tests.

## AC coverage

- AC-1 (all status groups retrieved on refresh) — `routes/api/admin/orders/index.get.ts`, covered by `index.get.test.ts › [SWHR3-C-0034]`.
- AC-2 / Contract C6 (200, exactly the four keys, each an `OrderRow[]`, empty array when a status has no orders) — same route, covered by `index.get.test.ts`'s two tests (seeded + empty-db cases).
- AC-3 (`sortOrders` — any of the five columns, either direction, new array, never mutates, ties by id ascending) — `src/utils/sort-orders.ts`, covered by `sort-orders.test.ts`'s 7 tests.

## Verification

```
$ bun run verify
Test Files  53 passed (53)
     Tests  318 passed (318)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is not installed in this
container and directs engineer containers to `bun run verify` instead (E2E runs in the QA-phase/CI
containers). This ticket adds no UI and no E2E spec, so nothing was skipped. Full detail and the
red→green proof: `tdd-test-result.md`.

## Notes

- The route does not check the caller's role or session itself — D4's admin-prefix enforcement
  lives in `middleware/auth.ts`, which is a different ticket's file ownership (not in this
  ticket's `PLAN.md` scope). `index.get.test.ts` calls the handler directly with no session,
  matching that scope.
- `a2a_run_tests` refused to record the platform-linked case `SWHR3-C-0034`: this project's
  `.vortex/config.yaml` has no `testEvidence` block, so it directed use of the `TDD-RESULT` marker
  instead — `tdd-test-result.md` carries both.
