---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0043
branch: vortex/feat/SWHR3-T-0043-client-server-integration-admin-orders-a-d6cf8a26
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0043/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0043: Client-Server Integration — admin orders API client and commit decisions dialog

## What changed

Added `src/utils/admin-orders-api.ts` (C11): `fetchOrdersByStatus()` and
`commitOrderDecisions(request)`, both thin wrappers over `apiFetch` so they inherit
`credentials: "same-origin"` (the httpOnly session cookie standing in for the legacy
JNLP-embedded session id, SD8) and surface `ApiError` unchanged. Added
`CommitDecisionsDialog` (D11), a three-phase dialog (confirm → success | error) matching the
three commit mockups: the confirmation lists every staged `orderId: PENDING → STATUS` and
states all-or-nothing; success reports the updated count and calls `onCommitted`; failure
shows the server message (always "Administrator credentials required" for a 403) and never
calls `onCommitted`, which is what keeps every staged decision — this component owns no
staged state itself.

## Files

- `src/utils/admin-orders-api.ts` (new) — `fetchOrdersByStatus`, `commitOrderDecisions` (C11)
- `src/utils/admin-orders-api.test.ts` (new)
- `src/components/admin/commit-decisions-dialog.tsx` (new) — `CommitDecisionsDialog` (D11)
- `src/components/admin/commit-decisions-dialog.test.tsx` (new)

## AC coverage

- **AC-1** (batch changes into one message, sent by a single HTTP POST) — `commitOrderDecisions`
  sends exactly one `POST /api/admin/orders/status` with the full request body (JSON, per
  SD2/SD4 — the legacy XML/`ApplRequestProcessor` wording maps to this route). Covered by
  `[SWHR3-C-0007]` in both `admin-orders-api.test.ts` and `commit-decisions-dialog.test.tsx`.
- **AC-2/AC-3** (session id embedded in JNLP / used for authenticated requests) — no JNLP in
  this rebuild (SD8): both client functions go through `apiFetch`'s
  `credentials: "same-origin"`, so the browser attaches the httpOnly `petstore_session`
  cookie automatically. Covered by the "same-origin credentials" test and
  `[SWHR3-C-0029]` (adapted — see Notes).
- **AC-4** / Contract C11 (exactly one POST with the whole request; both functions reject
  with the `ApiError` `apiFetch` builds, status and message preserved) — covered by every
  `admin-orders-api.test.ts` test.
- **AC-5** (403 → "Administrator credentials required" + staging kept; other error → server
  message + staging kept; success → updated count + `onCommitted`) — covered by
  `[SWHR3-C-0020]`, the 403 test, and the `[SWHR3-C-0007]` success test in
  `commit-decisions-dialog.test.tsx`.

## Verification

- `bun run test -- src/utils/admin-orders-api.test.ts src/components/admin/commit-decisions-dialog.test.tsx` — 2 files, 13 tests passed.
- `bun run verify` (lint + typecheck + full unit suite) — 63 files, 393 tests passed, 0 failed.
- `bun run verify:full` was attempted; its E2E preflight reported Chromium is not installed
  in this container. Per `AGENTS.md` this is the expected engineer-container state (E2E runs
  in the QA/CI containers); not retried. This ticket adds no E2E spec (see Notes).

Full detail: `artifacts/SWHR3-S-0003/SWHR3-T-0043/tdd-test-result.md`.

## Notes

`[SWHR3-C-0020]` is an `e2e`-level case ("Admin on /admin/orders … seeded order …") that
needs the assembled `/admin/orders` page, which does not exist yet — `design.md`'s ticket map
makes that page SWHR3-T-0046 (Admin Interface Integration), which depends on this ticket
among others, with the end-to-end journey itself owned by SWHR3-T-0047. Covered its intent at
the component level this ticket owns instead: `CommitDecisionsDialog` shown a rejected commit
displays the destructive alert with the server's message and never calls `onCommitted`
(the only thing that would let a caller clear staging). The real `/admin/orders` E2E
walk-through is T-0047's to write once the page exists.

`[SWHR3-C-0029]` similarly names a full `GET /api/admin/orders` round trip; that exact
scenario was already proven at the middleware+route level in SWHR3-T-0045's
`middleware/auth.test.ts` (`[SWHR3-C-0029]` there too — the platform links a case to more
than one ticket). Here it is covered at this ticket's own layer: `fetchOrdersByStatus` sends
`credentials: "same-origin"` and surfaces a 401 unchanged.

The confirmation mockup shows each row's customer name in addition to `orderId`/status, but
`PLAN.md`'s fixed props (`{ open, request, onClose, onCommitted }`) only give this component
an `OrderApprovalRequest` — `{ orderId, status }` pairs, no customer name. Rendered `id:
PENDING → STATUS` per row exactly as `PLAN.md`'s step 2 literally describes it, without
customer name — a minor, deliberate simplification following the fixed interface contract
rather than the mockup pixel-for-pixel; the page that assembles the real queue (T-0046) has
the row data to show it richer if desired.

Caught one real defect during the green run itself: an initial `useEffect` that reset the
dialog's phase on reopen tripped `react-hooks/set-state-in-effect` (a cascading-render
anti-pattern already called out in `src/hooks/use-session.ts`'s own comments). Fixed by
adjusting state during render instead, guarded by a `priorOpen` comparison — no test needed
adjusting since behaviour was unchanged, only the implementation technique.
