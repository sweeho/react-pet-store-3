---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0045
branch: vortex/feat/SWHR3-T-0045-error-handling-and-validation-request-pa-719b5b91
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0045/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0045: Error Handling and Validation — request parsing, admin role enforcement and admin provisioning

## What changed

Added `parseOrderApprovalRequest` (C5) — the field-level 422 gate a commit request must pass
before it reaches `updateOrders`. Added `lib/roles.ts`'s `getAccountRole` (D3), read fresh
from `accounts.role` per call, no caching. Extended `middleware/auth.ts` with the admin
prefix `/api/admin/**` (`isAdminApiPath`, D4): no session still 401s as before, a signed-in
non-admin now 403s (`ForbiddenError`), and an admin passes through — the role check runs on
every request, so a revoked role bites on the very next one with no sign-out required. `GET
/api/session` and `useSession`'s `SessionUser` now carry `role` (C6). Added the
`db/grant-admin.ts` operator script and its `admin:grant` package script (D12). No UI in
this ticket — nothing a user sees (`PLAN.md` `## Design reference`: none).

## Files

- `lib/order-approval-request.ts` (new) — `parseOrderApprovalRequest` (C5)
- `lib/order-approval-request.test.ts` (new)
- `lib/roles.ts` (new) — `getAccountRole` (D3)
- `lib/roles.test.ts` (new)
- `lib/protected-resources.ts` — added `ADMIN_API_PREFIX`, `isAdminApiPath` (D4)
- `lib/protected-resources.test.ts` — added admin-prefix tests
- `middleware/auth.ts` — admin-path 401/403 branch (D4, C6)
- `middleware/auth.test.ts` — added admin-path tests, incl. [SWHR3-C-0026], [SWHR3-C-0029]
- `routes/api/session.get.ts` — `user.role` via `getAccountRole` (C6)
- `routes/api/session.get.test.ts` — added role tests, incl. [SWHR3-C-0028]
- `src/hooks/use-session.ts` — `SessionUser.role: "customer" | "admin"` (C6)
- `src/hooks/use-session.test.tsx` — added an admin-role assertion
- `db/grant-admin.ts` (new) — operator script (D12)
- `package.json` — added the `admin:grant` script

## AC coverage

- **AC-1/AC-2/AC-3** (parse XML-equivalent Order elements into ChangedOrder, aggregate into
  one OrderApproval) — `parseOrderApprovalRequest`; per SD2/SD4 the request body is JSON,
  not literal XML. Covered by `[SWHR3-C-0014]`, `[SWHR3-C-0031]`, `[SWHR3-C-0032]`.
- **AC-4** (only administrators reach approval functions) — `middleware/auth.ts`'s admin
  branch. Covered by `[SWHR3-C-0026]` (403, order left PENDING) and the pass-through/401/
  revoke tests in `middleware/auth.test.ts`.
- **AC-5** / Contract C5 (every ValidationError case) — covered by `[SWHR3-C-0015]`,
  `[SWHR3-C-0030]` (partial — see Notes), `[SWHR3-C-0033]`, plus the missing/empty-array,
  > 500-entries and non-integer/non-positive-orderId tests.
- **AC-6** / Contract C6 (401/403 by path, revoke takes effect without sign-out, existing
  customer paths unchanged, `GET /api/session`/`useSession` expose role) — covered by the
  full `middleware/auth.test.ts` admin-paths suite (incl. `[SWHR3-C-0029]`), and the
  `routes/api/session.get.test.ts` / `use-session.test.tsx` role tests (incl.
  `[SWHR3-C-0028]`).
- **AC-7** (`admin:grant` sets an existing account's role, non-zero exit + clear message for
  an unknown user) — `db/grant-admin.ts`; verified by a manual smoke run (see Verification —
  `PLAN.md` step 6 defers its automated end-to-end exercise to SWHR3-T-0047).

## Verification

- `bun run test -- lib/order-approval-request.test.ts lib/roles.test.ts lib/protected-resources.test.ts middleware/auth.test.ts routes/api/session.get.test.ts src/hooks/use-session.test.tsx` — 6 files, 42 tests passed.
- `bun run verify` (lint + typecheck + full unit suite) — 57 files, 359 tests passed, 0 failed.
- `bun run verify:full` was attempted; its E2E preflight reported Chromium is not installed
  in this container. Per `AGENTS.md` this is the expected engineer-container state (E2E runs
  in the QA/CI containers); not retried. This ticket adds no E2E spec.
- `db/grant-admin.ts` manual smoke run (isolated temp cwd, symlinked to this repo's `db/`,
  `lib/`, `drizzle/`, `node_modules/`): no username arg → `Usage: bun run admin:grant
<username>` + exit 1; unknown username → `No account found with user name "nosuchuser"` +
  exit 1; a seeded account → `Granted admin role to "smoketestadmin" (account id 1).`,
  confirmed by a direct db read showing `role: "admin"`.

Full detail: `artifacts/SWHR3-S-0003/SWHR3-T-0045/tdd-test-result.md`.

## Notes

`a2a_run_tests` was refused on the prior ticket in this sprint for the same reason (no
`testEvidence` block on `.vortex/config.yaml`); reused the `TDD-RESULT:` marker fallback
directly rather than re-calling a tool already known to refuse.

`[SWHR3-C-0030]` ("Only requestType UPDATESTATUS reaches updateOrders") and `[SWHR3-C-0029]`
describe full HTTP round-trips through `POST /api/admin/orders/status`, which does not exist
yet — that route is SWHR3-T-0039, which `design.md`'s ticket map makes depend on this ticket.
`[SWHR3-C-0030]` is covered here at the level this ticket owns: `parseOrderApprovalRequest`
rejecting any `requestType` other than `"UPDATESTATUS"` is exactly the gate that keeps a
misrouted request from ever reaching `updateOrders`; the full request→response round trip is
T-0039's to test once the route exists. `[SWHR3-C-0026]` and `[SWHR3-C-0029]` are covered
against the parts that do exist — the middleware directly, and (for C-0029) the already-
merged `GET /api/admin/orders` handler from SWHR3-T-0041 — without creating or modifying the
POST route.

`src/hooks/use-session.ts`'s `role` change is type-only: the hook already passed the fetched
`user` object through unmodified, so the existing mocked-JSON test stayed green even before
the type was added (there was no runtime gap to redden). The type addition is still real —
it is what every consumer of `useSession` now gets, checked by `tsc --build` in the green
run — it just has no distinct red phase of its own.
