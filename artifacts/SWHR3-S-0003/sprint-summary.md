---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
idea: SWHR3-I-0003
branch: vortex/sprint/swhr3-s-0003-21038629
upstream:
  [
    artifacts/SWHR3-S-0003/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0003/qa-test-report.md,
    artifacts/SWHR3-S-0003/integration-test-result.md,
    artifacts/SWHR3-S-0003/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0003/release-notes.md]
---

# Sprint summary — SWHR3-S-0003

Sprint goal: "SWHR3-I-0003: Order Approval and Status Management". **Met.** All 12 implementation TASKs reached DONE, and integration QA returned PASS: 25/25 scenarios pass, and no integration defects were found.

## Tickets

The plan is change `swhr3-i-0003-order-approval-and-status-m`. Its `design.md` holds the decisions (D1–D12), the contracts and the spec-discrepancy table (SD1–SD15). Per-ticket steps and outcomes are in `artifacts/SWHR3-S-0003/<TICKET-KEY>/` (`PLAN.md`, `summary.md`, `tdd-test-result.md`).

| Ticket       | Type  | Title                                                                                              | Outcome     |
| ------------ | ----- | -------------------------------------------------------------------------------------------------- | ----------- |
| SWHR3-T-0031 | TASK  | Sprint plan — SWHR3-S-0003                                                                         | DONE        |
| SWHR3-T-0032 | EPIC  | Order Approval and Status Management                                                               | DONE        |
| SWHR3-T-0033 | STORY | Order statuses change only through an atomic, validated administrator commit                       | DONE        |
| SWHR3-T-0034 | STORY | Administrators open the order review area and see every order by status                            | DONE        |
| SWHR3-T-0035 | STORY | Administrators stage, commit and safely refresh decisions                                          | DONE        |
| SWHR3-T-0036 | TASK  | Order Status Management — orders table, account role, status rules and orders service              | DONE (#27)  |
| SWHR3-T-0038 | TASK  | Client-Side Change Tracking — staged decisions hook and order-approval client types                | DONE (#28)  |
| SWHR3-T-0041 | TASK  | Data Retrieval and Filtering — GET /api/admin/orders and client-side order sorting                 | DONE (#29)  |
| SWHR3-T-0040 | TASK  | Business Delegate Implementation — updateOrders batch service                                      | DONE (#30)  |
| SWHR3-T-0045 | TASK  | Error Handling and Validation — request parsing, admin role enforcement and admin provisioning     | DONE (#31)  |
| SWHR3-T-0037 | TASK  | Rich Client UI — Orders approval table with Table, Badge and Dialog primitives                     | DONE (#32)  |
| SWHR3-T-0043 | TASK  | Client-Server Integration — admin orders API client and commit decisions dialog                    | DONE (#33)  |
| SWHR3-T-0044 | TASK  | EJB Transaction Management — immediate-mode transactions and batch atomicity                       | DONE (#34)  |
| SWHR3-T-0039 | TASK  | Server Communication Protocol — POST /api/admin/orders/status commit route                         | DONE (#35)  |
| SWHR3-T-0046 | TASK  | Integration with Admin Interface — /admin shell, administrator gate, home and four-tab review page | DONE (#36)  |
| SWHR3-T-0042 | TASK  | Uncommitted Changes Detection — refresh control with discard warning                               | DONE (#37)  |
| SWHR3-T-0047 | TASK  | Testing and Validation — order-approval E2E journey, seed script and archive-safe manifest test    | DONE (#38)  |
| SWHR3-T-0049 | TASK  | Integration QA report — SWHR3-S-0003                                                               | DONE (#39)  |
| SWHR3-T-0050 | TASK  | Sprint close bundle — SWHR3-S-0003                                                                 | This ticket |

## What shipped

An administrator review area for order approval. The code change is 74 files, about 5,970 lines added, most of it tests.

- **Data:** a new `orders` table and a `role` column on `accounts` (migration `drizzle/0003_pale_albert_cleary.sql`). The four statuses (PENDING, APPROVED, DENIED, COMPLETED) and the only legal administrator transitions (PENDING → APPROVED, PENDING → DENIED) live in `lib/order-status.ts`. All status writes go through `lib/orders.ts`.
- **API:** `GET /api/admin/orders` returns orders grouped by the four statuses. `POST /api/admin/orders/status` commits a batch of decisions in one immediate-mode transaction (`lib/order-approval.ts`), so the whole batch persists or none of it does. Each commit writes one server log line, `order-approval: committed N (id→STATUS, …)`. The line names no actor, because the PRD rules out an approval audit trail.
- **Access:** every path under `/api/admin/` is administrator-only by prefix in `middleware/auth.ts`. Signed out gives 401. A non-admin session gives 403 `FORBIDDEN`. An operator grants the role with the new `admin:grant` script. There is no admin-management UI.
- **UI:** `/admin` (home with the four counts), `/admin/orders` (a sortable queue in four tabs where only Pending is editable, with staged decisions and a "Commit N decisions" confirmation dialog), and `/admin/signin`. A refresh while decisions are staged asks "Discard N uncommitted changes?" first. New UI primitives: Table, Badge, Dialog.
- **Test support:** `db/seed-orders.ts` inserts PENDING orders for local demos and E2E. `e2e/order-approval.spec.ts` covers 7 journeys.

Root docs are unchanged at close. Planning (SWHR3-T-0031) already brought `ARCHITECTURE.md` up to date with the orders entity, account roles, the `/api/admin` prefix rule and two Key Decisions. It also brought `DESIGN.md` up to date with Table, Badge, Dialog, the admin area and the staged-edit pattern. `PRODUCT.md` already listed the `order-approval` capability. The shipped code matches all three documents, so no trigger fired at close.

## Divergence from plan

- **Idea wording vs spec.** The idea's AC names a "processing" status. The spec has DENIED instead, and there is no "processing" status (SD11). "Enforced and logged" was delivered as transition enforcement plus one log line per commit, not an audit trail (SD12).
- **Mockup vs build.** The queue uses the wireframe's four tabs, not the mockup's two (D10, SD14). The per-row status control is a native `<select>`, not the mockup's custom listbox (T-0037). The refresh-dialog copy follows D11, not the mockup's wording (T-0042). The commit bar sits below the table as the mockup shows, not above it as `DESIGN.md`'s prose says (T-0046). QA did no pixel comparison against the mockups.
- **Bug found and fixed in-sprint (T-0046).** For a signed-out or non-admin visitor, the admin pages' data loads ran before `RequireAdmin` redirected. The resulting 401/403 replaced the redirect with an error screen. Both pages now ignore a 401/403 from that load.
- **Sequencing gap (T-0040).** `updateOrders` first shipped without the `immediate` option because `lib/transaction.ts` did not accept it yet. T-0044 added the option and the call now passes `{ behavior: "immediate" }`, as D6 specifies.
- **AGENTS.md was edited by an implementation ticket (T-0042).** It added the `bun --bun run dev` gotcha. The note is accurate, but AGENTS.md is human-authored. The correction belongs in `.vortex/agents-generated.md` for a human to fold in. It is left in place so it stays visible to a human reviewer.

## Verification

**PASS.** Build is green. `bun run verify` passes 443/443 unit tests across 71 files. Playwright passes 18/18 tests, 7 of them the order-approval journeys. All 25 scenarios in the `order-approval` delta spec pass, and legacy XML/JNLP/servlet wording is read through SD2–SD8. See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **SWHR3-T-0048 (DEFECT, BACKLOG):** `db/client.ts` sets no SQLite `busy_timeout`. The server therefore answers 500 "database is locked" while another process (the seed or grant script) holds the write lock. `e2e/order-approval.spec.ts` works around this with retries, and the workaround should be removed once the defect is fixed. The defect was found by T-0047 and does not affect single-process production use.
- **Environment (not filed):** the repo pins `@playwright/test ~1.50` (chromium-1155), but agent containers ship chromium-1223. So `bun run test:e2e`'s preflight refuses to run, and QA had to symlink the browser outside the repo. Implementation containers could not run E2E at all.
- **Order creation** is out of scope. A PENDING order exists only through `db/seed-orders.ts` until checkout (`swhr3-i-0005`) ships. Fulfilment (APPROVED → COMPLETED), customer emails and the Reports nav (`admin-dashboard`) are also out of scope.

## Retrospective

These points are judgment, not measured fact.

- **Went well:** the spec-discrepancy table (SD1–SD15) settled up front how each legacy-specific scenario (XML, JNLP, servlet, EJB) would be verified. QA then recorded a verdict for every scenario without re-litigating any of them.
- **Went well:** the interface contracts let 12 TASKs merge in sequence with no integration defects. QA was green on its first run.
- **Could improve:** 12 TASKs for one capability was heavy, and planning flagged it as risk R2. Several tickets were thin slices of one module: T-0040 and T-0044 both covered batch atomicity, and T-0044's cases already passed against unmodified code. About half as many tickets would likely have delivered the same scope with less coordination.
- **Could improve:** file ownership sometimes blocked a ticket from finishing its own contract. T-0040 could not add the transaction option it needed, and T-0039/T-0041 could not exercise role enforcement end to end. Ownership maps should follow the contract, not the file.
- **Could improve:** Chromium was unavailable or mismatched in every implementation container, so the UI was not seen in a real browser until QA. This is now the third sprint with this finding.
- **Could improve:** `a2a_run_tests` refused red/green runs because `.vortex/config.yaml` has no `testEvidence` block. Every ticket fell back to `TDD-RESULT:` markers.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                                  |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ---------------------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-TASK PLAN.md                         | `openspec/changes/swhr3-i-0003-order-approval-and-status-m/`, `artifacts/SWHR3-S-0003/*/PLAN.md` | Satisfied | —                                                          |
| Every change merged through a PR | Squash-merge commits #27–#39                               | sprint branch history                                                                            | Satisfied | —                                                          |
| Tests executed per ticket        | TDD result markers + colocated tests                       | `artifacts/SWHR3-S-0003/*/tdd-test-result.md`                                                    | Satisfied | `a2a_run_tests` unavailable; E2E ran only at T-0047 and QA |
| Change verified before release   | QA report, PASS, 25/25 scenarios                           | `artifacts/SWHR3-S-0003/qa-test-report.md`                                                       | Satisfied | No mockup pixel comparison                                 |
| Defects dispositioned            | 0 at QA; SWHR3-T-0048 filed to backlog                     | `integration-defects-resolution.md`, this file                                                   | Satisfied | —                                                          |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided                               |
