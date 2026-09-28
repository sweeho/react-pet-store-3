---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0043
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0043/tdd-test-result.md]
---

# Plan — SWHR3-T-0043: Client-Server Integration — admin orders API client and commit decisions dialog

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

The browser reads grouped orders and commits one batch through `apiFetch` with the session cookie, and `CommitDecisionsDialog` confirms, sends and reports the result as the commit mockups show.

## Steps

1. Create `src/utils/admin-orders-api.ts` per `design.md` C11, using `apiFetch` from `src/utils/api.ts` (same-origin, so the httpOnly session cookie is sent; SD8).
2. Create `src/components/admin/commit-decisions-dialog.tsx` with props `{ open, request, onClose, onCommitted }` using the `Dialog` and `Alert` primitives (D11): the confirmation lists `id: PENDING → STATUS` and states all-or-nothing; the success state reports the updated count; the failure state quotes the `ApiError` message (403 shows "Administrator credentials required") and never clears staging.
3. Tests: mock `fetch` for the API module (one POST, body equals the request, `ApiError` surfaces); dialog tests for confirm → success, confirm → 409 failure, confirm → 403, and cancel.

## File/module ownership

- `src/utils/admin-orders-api.ts, admin-orders-api.test.ts`
- `src/components/admin/commit-decisions-dialog.tsx, commit-decisions-dialog.test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

`artifacts/SWHR3-S-0003/design/mockup-commit-staged-decisions-confirmation.html`, `artifacts/SWHR3-S-0003/design/mockup-commit-staged-decisions-success.html`, `artifacts/SWHR3-S-0003/design/mockup-commit-staged-decisions-failure-all-roll.html`, `artifacts/SWHR3-S-0003/design/wireframe-commit-staged-decisions-dialog-success-a.html`. Index: `artifacts/SWHR3-S-0003/design/MANIFEST.md`.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5 — the ticket's acceptance criteria, each proven by a test named for it.
