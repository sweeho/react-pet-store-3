---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0039
branch: vortex/feat/SWHR3-T-0039-server-communication-protocol-post-api-a-6d12eddb
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0039/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0039: Server Communication Protocol — POST /api/admin/orders/status commit route

## What changed

Added `POST /api/admin/orders/status`: reads the JSON body, parses it with `parseOrderApprovalRequest`
(anything other than `requestType: "UPDATESTATUS"` is refused), delegates to `updateOrders`, and
answers `{ type: "UPDATEORDERS", status: "SUCCESS", updated }`. Every failure is converted with
`toHttpError`. No UI: this ticket touches nothing a user sees (PLAN.md).

## Files

- `routes/api/admin/orders/status.post.ts` (new) — `readBody` → `parseOrderApprovalRequest` (C5) → `updateOrders` (C4) → the C6 success body, wrapped in `try`/`toHttpError`.
- `routes/api/admin/orders/status.post.test.ts` (new) — integration tests against a real `H3Event` and the in-memory db.

## AC coverage

- AC-1 (UPDATESTATUS routes to `updateOrders`/delegates to the batch service) — the route, covered by `status.post.test.ts › [SWHR3-C-0013]`.
- AC-2 (success answers `Type=UPDATEORDERS`/`Status=SUCCESS`, i.e. JSON `{ type, status }`) — covered by `› [SWHR3-C-0018]`.
- AC-3 (error response carries the exception message) — covered by `› [SWHR3-C-0019]`.
- AC-4 (only `requestType === "UPDATESTATUS"` reaches `updateOrders`) — covered by `› [SWHR3-C-0030]`.
- AC-5 / Contract C6 (200 with exactly `{ type, status, updated }`, `updated` equals the change count; non-`UPDATESTATUS` → 422, no order changes) — covered by `› [SWHR3-C-0018]` and `› [SWHR3-C-0030]`.
- AC-6 (a non-PENDING order → 409 `INVALID_TRANSITION`, an unknown order → 404 `NOT_FOUND`, both naming the offending order id, batch otherwise unchanged) — covered by `› [SWHR3-C-0019]` and `› answers 404 NOT_FOUND for an unknown order id...`.

## Verification

```
$ bun run verify
Test Files  65 passed (65)
     Tests  406 passed (406)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is not installed in this
container and directs engineer containers to `bun run verify` instead (E2E runs in the QA-phase/CI
containers). This ticket adds no UI and no E2E spec, so nothing was skipped. Full detail and the
red→green proof: `tdd-test-result.md`.

## Notes

- The route does not check the caller's role/session itself — D4's admin-prefix enforcement lives
  in `middleware/auth.ts` (already wired up by SWHR3-T-0045, merged before this ticket started) but
  is a different ticket's file ownership; the test calls the handler directly with no session,
  matching `PLAN.md`'s scope (same pattern as `routes/api/admin/orders/index.get.test.ts`, T-0041).
- `a2a_run_tests` refused to record the four platform-linked cases: this project's
  `.vortex/config.yaml` has no `testEvidence` block, so it directed use of the `TDD-RESULT` marker
  instead — `tdd-test-result.md` carries both.
