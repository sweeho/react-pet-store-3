---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0045
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0045/tdd-test-result.md]
---

# Plan — SWHR3-T-0045: Error Handling and Validation — request parsing, admin role enforcement and admin provisioning

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

Malformed commit requests are refused with field-level 422s, `/api/admin/**` is closed to everyone but administrators, the client can see the caller's role, and an operator can promote an account.

## Steps

1. Create `lib/order-approval-request.ts` per `design.md` C5, returning the `OrderApproval` type from `lib/order-approval.ts` (SD2, SD4).
2. Create `lib/roles.ts` with `getAccountRole(accountId)` (D3).
3. In `lib/protected-resources.ts` add `ADMIN_API_PREFIX = "/api/admin/"` and `isAdminApiPath(pathname)`; in `middleware/auth.ts`, for an admin path: no active session → the existing 401; active session whose role is not `admin` → `ForbiddenError` via `toHttpError` (D4, C7). Customer path handling is unchanged.
4. `routes/api/session.get.ts` adds `role` to `user` (C6); `src/hooks/use-session.ts` adds `role` to its `SessionUser` type.
5. Create `db/grant-admin.ts` (reads the user name from argv, sets `role = "admin"`, exits non-zero for an unknown user) and add the `admin:grant` script to `package.json` (D12).
6. Tests: parser cases per C5; middleware 401/403/pass-through and immediate revocation; session role; roles lookup. The grant script is exercised end to end by SWHR3-T-0047.

## File/module ownership

- `lib/order-approval-request.ts, order-approval-request.test.ts`
- `lib/roles.ts, roles.test.ts`
- `lib/protected-resources.ts, protected-resources.test.ts`
- `middleware/auth.ts, auth.test.ts`
- `routes/api/session.get.ts, session.get.test.ts`
- `src/hooks/use-session.ts, use-session.test.tsx`
- `db/grant-admin.ts`
- `package.json` (admin:grant entry only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5
- AC-6
- AC-7 — the ticket's acceptance criteria, each proven by a test named for it.
