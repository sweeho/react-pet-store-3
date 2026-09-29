---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0038
branch: vortex/feat/SWHR3-T-0038-client-side-change-tracking-staged-decis-04797277
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0038/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0038: Client-Side Change Tracking — staged decisions hook and order-approval client types

## What changed

Added the client order-approval types (C9) and `useStagedDecisions` (C10, D8): a
`Map<orderId, AssignableStatus>` state model with `stage`, `unstage`, `clear`, `count`,
`hasUncommittedChanges`, and `toRequest()` that packages every staged change into one
`OrderApprovalRequest`. This is the state model `OrdersTable` (SWHR3-T-0037) stages against and
`CommitDecisionsDialog`/commit flow (SWHR3-T-0043) sends. No UI in this ticket — nothing a user
sees (`PLAN.md` `## Design reference`: none).

## Files

- `src/types/order-approval.ts` (new) — `OrderRow`, `OrdersByStatus`, `ChangedOrder`,
  `OrderApprovalRequest`, `OrderApprovalResponse`, matching server contracts C3–C6.
- `src/hooks/use-staged-decisions.ts` (new) — the staged-decisions hook.
- `src/hooks/use-staged-decisions.test.tsx` (new) — 11 hook tests.

## AC coverage

- **AC-1** (serialize to XML-equivalent request with OrderId/OrderStatus) — `toRequest()`; per SD2
  the request body is JSON, not literal XML, and JSON stands in for the Order elements. Covered by
  `[SWHR3-C-0008]`.
- **AC-2** (root RequestType UPDATESTATUS, Order children with OrderId/OrderStatus) —
  `toRequest().requestType === "UPDATESTATUS"`, `changes: [{orderId, status}]`. Covered by
  `[SWHR3-C-0017]`.
- **AC-3** / Contract C10 (stage/unstage/replace, ascending-orderId `toRequest()`) — covered by
  `[SWHR3-C-0004]`, `[SWHR3-C-0006]`, `[SWHR3-C-0008]`, and the replace/unstage/clear tests.
- **AC-4** (`hasUncommittedChanges` true iff something staged, false after `clear()` or unstaging
  the last order) — covered by the four `hasUncommittedChanges …` tests.
- **AC-5** / Contract C9 (client types matching C3–C6) — `src/types/order-approval.ts`; proven by
  `tsc --build` and by every hook test compiling against these types.

## Verification

- `bun run test -- src/hooks/use-staged-decisions.test.tsx` — 1 file, 11 tests passed.
- `bun run verify` (lint + typecheck + full unit suite) — 52 files, 320 tests passed, 0 failed.
- `bun run verify:full` was attempted; its E2E preflight reported Chromium is not installed in this
  container. Per `AGENTS.md` this is the expected engineer-container state (E2E runs in the QA/CI
  containers); not retried. This ticket adds no E2E spec.

Full detail and raw output: `artifacts/SWHR3-S-0003/SWHR3-T-0038/tdd-test-result.md`.

## Notes

`a2a_run_tests` was called for the red phase first and refused ("no `testEvidence` block on this
sprint's `.vortex/config.yaml`"); fell back to the `TDD-RESULT:` marker in `tdd-test-result.md` as
the refusal message itself instructed.

Two of the linked test cases (`SWHR3-C-0004`, `SWHR3-C-0006`) describe UI interaction ("tick a
checkbox", "click Approve selected") against `OrdersTable`, which this ticket does not own (it
belongs to SWHR3-T-0037, per `PLAN.md`'s file ownership and the design's ticket map). Both are
exercised here at the hook level — the equivalent direct `stage(ids, status)` call — since
`useStagedDecisions` is the state model that interaction will drive; SWHR3-T-0037 covers the actual
checkbox/button wiring.
