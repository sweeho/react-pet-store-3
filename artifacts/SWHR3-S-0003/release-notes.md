---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
idea: SWHR3-I-0003
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Release notes — SWHR3-S-0003

Administrators can now review orders and approve or deny them in batches.

## Added

- **Order review area at `/admin`.** The home page shows how many orders are in each of the four statuses: Pending, Approved, Denied and Completed. `/admin/orders` lists orders in four tabs, and every column can be sorted. (SWHR3-T-0046, SWHR3-T-0037, SWHR3-T-0041)
- **Staged, batch decisions.** On the Pending tab an administrator can mark one or more orders Approved or Denied. The decisions stay local until "Commit N decisions" is confirmed. The commit is all-or-nothing: if any order in the batch fails, none change, the server's message is shown, and the staged decisions are kept. (SWHR3-T-0038, SWHR3-T-0043, SWHR3-T-0040, SWHR3-T-0044)
- **Uncommitted-changes warning.** Refreshing while decisions are staged asks "Discard N uncommitted changes?" before discarding them. (SWHR3-T-0042)
- **Enforced transitions.** An order can move only from Pending to Approved or Denied. Any other change is rejected with 409 `INVALID_TRANSITION`. Each commit writes one server log line listing the changed orders. (SWHR3-T-0036, SWHR3-T-0039)
- **Administrator sign-in.** `/admin/signin` uses existing customer credentials and then checks the administrator role. A non-administrator sees "This account is not an administrator". (SWHR3-T-0046)
- **API:** `GET /api/admin/orders` and `POST /api/admin/orders/status`. Every `/api/admin/` path returns 401 when signed out and 403 `FORBIDDEN` for non-administrators. (SWHR3-T-0045, SWHR3-T-0039, SWHR3-T-0041)

## Upgrade notes

- **Database migration** `drizzle/0003_pale_albert_cleary.sql` creates the `orders` table and adds `accounts.role` (default `customer`). The app applies it automatically on start.
- **Granting administrator access:** `bun run admin:grant <username>` gives an existing account the administrator role. There is no UI for this.
- **Demo data:** `bun db/seed-orders.ts --username <name> [--count <n>]` inserts Pending orders for an existing account. Orders cannot yet be placed through the storefront.

## Known limitations

- Running the seed or grant script while the server is writing can make the server answer 500 "database is locked". Tracked as SWHR3-T-0048.
- The app does not record who made a decision, by design (PRD non-goal).

## Not included

- Order creation through checkout, fulfilment (Approved → Completed), customer status emails and sales reporting.

## Verification

Verified at integration QA: PASS. The build is green, 443/443 unit tests and 18/18 E2E tests passed, all 25 order-approval scenarios passed, and no defects were found. See `artifacts/SWHR3-S-0003/qa-test-report.md`.

## Compliance / Control Evidence

| Control                                | Evidence        | Location                                   | Status    | Exception |
| -------------------------------------- | --------------- | ------------------------------------------ | --------- | --------- |
| Release contents recorded              | this file       | `artifacts/SWHR3-S-0003/release-notes.md`  | Satisfied | —         |
| Release verified before land           | QA PASS verdict | `artifacts/SWHR3-S-0003/qa-test-report.md` | Satisfied | —         |
| Config and migration changes disclosed | Upgrade notes   | this file                                  | Satisfied | —         |
