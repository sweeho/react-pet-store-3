---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0046
branch: vortex/feat/SWHR3-T-0046-integration-with-admin-interface-admin-s-0b7fc950
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0046/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0046: Integration with Admin Interface — /admin shell, administrator gate, home and four-tab order review page

## What changed

Assembled the admin area (design.md D9–D11): `RequireAdmin` (the client-side admin gate)
and `AdminShell` (header/nav/user-badge/sign-out) in `src/components/admin/`, plus three
pages — `/admin` (home, four counts), `/admin/orders` (four-tab queue, staging, commit,
refresh) and `/admin/signin` (sign-in + the not-an-administrator state). Wires together
`OrdersTable` (SWHR3-T-0037), `useStagedDecisions` (SWHR3-T-0038), `sortOrders`
(SWHR3-T-0041) and `CommitDecisionsDialog` (SWHR3-T-0043), all built by earlier tickets.

## Files

- `src/components/admin/require-admin.tsx` (+ test) — new: the role-aware gate.
- `src/components/admin/admin-shell.tsx` (+ test) — new: the shared chrome.
- `src/pages/admin/index.tsx` (+ test) — new: `/admin` home.
- `src/pages/admin/orders.tsx` (+ test) — new: `/admin/orders` queue.
- `src/pages/admin/signin.tsx` (+ test) — new: `/admin/signin`.

## AC coverage

- AC-1 (signed-out → `/admin/signin?redirect=<path>`; admin sign-in returns there) —
  `RequireAdmin` builds the redirect; `signin.tsx`'s `handleSignIn` re-checks
  `GET /api/session` (the sign-in response carries no role) and navigates to
  `redirect` when it answers `admin`. Covered by `require-admin.test.tsx` and
  `signin.test.tsx`'s admin-redirect cases.
- AC-2 (non-admin sees the not-an-administrator notice, no order data, form kept) —
  `signin.tsx` shows the notice from either a fresh non-admin sign-in or an
  already-non-admin session (redirected here by `RequireAdmin`), and always renders the
  same form. Covered by `[SWHR3-C-0027]` and the "already signed in as a non-admin" case.
- AC-3 (`/admin` counts + link; shell shows user + ADMINISTRATOR label + working
  Sign out) — `index.tsx` renders `ORDER_STATUSES.map` counts from `fetchOrdersByStatus`;
  `AdminShell` reuses the existing `SignOutButton`. Covered by `index.test.tsx` and
  `admin-shell.test.tsx`.
- AC-4 (four tabs with counts; only Pending editable, others read-only and say so) —
  `orders.tsx`'s tab bar + `OrdersTable`'s own `editable` prop. Covered by
  `[SWHR3-C-0001]`, `[SWHR3-C-0025]` and the staging/refresh tests.
- AC-5 (successful commit clears staging and reloads all four groups; a failed commit
  keeps every staged decision) — `CommitDecisionsDialog`'s `onCommitted` callback calls
  `staging.clear()` then reloads; `onCommitted` never fires on failure, so nothing is
  cleared. Covered by the two commit-flow tests in `orders.test.tsx`.

## Verification

```
$ bun run test -- <5 new test files>    # red, every export a stub throwing VortexNotImplemented
Test Files  5 failed (5)
     Tests  25 failed (25)

$ bun run test -- <5 new test files>    # green, after implementing
Test Files  5 passed (5)
     Tests  25 passed (25)

$ bun run verify                         # full gate: lint + typecheck + full suite
Test Files  68 passed (68)
     Tests  418 passed (418)
```

See `tdd-test-result.md` — `TDD-RESULT: 418 passed, 0 failed`.

`bun run verify:full` was attempted but this container has no Chromium installed; the E2E
tier was not run here and is covered in Validation's browser-equipped container.

## Notes

- Found and fixed a real bug while writing the redirect tests: `/admin` and
  `/admin/orders`'s own data-loading effects run regardless of what `RequireAdmin`
  decides to render (React mounts the whole tree together), so a signed-out or non-admin
  visitor's `fetchOrdersByStatus()` 401/403s and would otherwise `throw loadError` during
  render — pre-empting `RequireAdmin`'s redirect with an error screen instead. Both pages
  now swallow a 401/403 from that load (an `ApiError` check) and let `RequireAdmin`'s own
  session check decide what renders next.
- The per-row status control's "staged" marker and native-`<select>` choice are
  SWHR3-T-0037's decisions (`OrdersTable`), not this ticket's; this page only supplies
  `staged`/`onStage`/`selectedIds`/`onSelectionChange` per contract C12.
- The commit bar sits below the table (mockup-order-review-pending-queue-with-staged-d
  .html), not "above the table" as DESIGN.md's generic prose says — the ticket's own
  design reference wins per "build what the mockup shows".
- The topbar's role indicator is rendered as a small inline pill ("Administrator") rather
  than the shared `Badge` primitive, since `Badge`'s variant enum is order-status-specific
  (pending/approved/denied/completed/staged) and extending it is outside this ticket's
  file ownership (`src/components/ui/badge-variants.ts` belongs to SWHR3-T-0037).
