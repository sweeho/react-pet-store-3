---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0042
branch: vortex/feat/SWHR3-T-0042-uncommitted-changes-detection-refresh-co-58223642
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0042/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0042: Uncommitted Changes Detection — refresh control with discard warning

## What changed

Added `RefreshOrdersControl` and wired it into `/admin/orders` in place of the plain Refresh
button. With nothing staged it reloads at once; with staged decisions it opens a "Discard N
uncommitted changes?" dialog listing each change as `id → STATUS`. "Cancel — keep my changes"
closes the dialog and keeps everything; "Refresh anyway" clears staging and reloads.

## Files

- `src/components/admin/refresh-orders-control.tsx` (new) — the control and its dialog, per `design.md` D8/D11/C12 and PLAN.md's literal copy.
- `src/components/admin/refresh-orders-control.test.tsx` (new) — component tests.
- `src/pages/admin/orders.tsx` — replaced the plain Refresh `Button` with `RefreshOrdersControl`, wired to `load()` and `staging.clear`.
- `src/pages/admin/orders.test.tsx` — extended with the discard-confirm and discard-cancel flows; cited the existing no-staged-refresh test to the matching linked case.
- `AGENTS.md` — documented that `bun run dev` can hit the same `bun:sqlite`/Node-ESM issue as `test`, and that `bun --bun run dev` avoids it (found while trying to verify this ticket's UI in a browser, see Notes).

## AC coverage

- AC-1 (warning dialog shown for pending changes) — `refresh-orders-control.tsx`, covered by `refresh-orders-control.test.tsx › [SWHR3-C-0009]`.
- AC-2 (confirming proceeds with refresh) — covered by `refresh-orders-control.test.tsx › 'Refresh anyway' …` and `orders.test.tsx › [SWHR3-C-0011]`.
- AC-3 (cancelling does not refresh, retains local changes) — covered by `refresh-orders-control.test.tsx › 'Cancel — keep my changes' …` and `orders.test.tsx › [SWHR3-C-0012]`.
- AC-4 (nothing staged → immediate reload, dialog never opens) — covered by `refresh-orders-control.test.tsx › [SWHR3-C-0010]` and `orders.test.tsx › [SWHR3-C-0010]`.
- AC-5 (dialog title states the count; body lists each staged change as id → status) — covered by `refresh-orders-control.test.tsx › [SWHR3-C-0009]` and `› names every staged change in the dialog body`.

## Verification

```
$ bun run verify
Test Files  71 passed (71)
     Tests  438 passed (438)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is not installed in this
container and directs engineer containers to `bun run verify` instead (E2E runs in the QA-phase/CI
containers). `bun run dev` (the declared `start` command) also fails in this container with an
unrelated `bun:` ESM-scheme error in Nitro's dev sub-process — fixed the gotcha into `AGENTS.md`
(`bun --bun run dev` avoids it, same underlying cause as the existing `test` gotcha); with that,
the dev server serves `/admin/orders` with a `200`, but no Chromium remains to actually render and
click through it, so pixel-level verification was not possible — the Testing Library suite is the
verification evidence in its place. Full detail: `tdd-test-result.md`.

## Notes

- The dialog's copy follows `design.md` D11 verbatim ("Discard N uncommitted changes?", "Cancel —
  keep my changes", "Refresh anyway"), which differs from the mockup's own wording ("Discard 3
  uncommitted decisions?", "Cancel", "Refresh and discard") and omits the mockup's customer-name
  column — `useStagedDecisions`' staged map (SWHR3-T-0038) carries only `orderId → status`, and
  D11/`PLAN.md` both specify `id → STATUS` as the list format, not the mockup's fuller row. The
  mockup's overall dialog layout (warning icon, bordered list, note strip) is otherwise followed.
- The two platform-linked `e2e`-scenario cases (`SWHR3-C-0011`, `SWHR3-C-0012`) are proven here at
  the page-integration (Testing Library) level per `PLAN.md` step 3, not as a new Playwright spec —
  `e2e/order-approval.spec.ts` belongs to SWHR3-T-0047 ("Testing and Validation"), which is outside
  this ticket's file ownership.
- `a2a_run_tests` refused to record the four platform-linked cases: this project's
  `.vortex/config.yaml` has no `testEvidence` block, so it directed use of the `TDD-RESULT` marker
  instead — `tdd-test-result.md` carries both.
