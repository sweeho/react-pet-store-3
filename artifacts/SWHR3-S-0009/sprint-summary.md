---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0009
idea: SWHR3-I-0007
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream:
  [
    artifacts/SWHR3-S-0009/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0009/qa-test-report.md,
    artifacts/SWHR3-S-0009/integration-test-result.md,
    artifacts/SWHR3-S-0009/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0009/release-notes.md]
---

# Sprint summary — SWHR3-S-0009

Sprint goal: "SWHR3-I-0007: Supplier Portal and Inventory Management". **Met.** All 18 implementation TASKs reached DONE. Integration QA returned PASS after fixing two defects in place: a migration failure on a populated database, and a Playwright role assertion. No DEFECT tickets were filed.

## Tickets

The plan is change `swhr3-i-0007-supplier-portal-and-invento`. Its `design.md` section "Rebuild on this repository (sprint SWHR3-S-0009)" holds the decisions (D1–D10), contracts (C1–C12) and spec discrepancies (SD1–SD10). Per-ticket detail is in `artifacts/SWHR3-S-0009/<TICKET-KEY>/`, and the designs are in `artifacts/SWHR3-S-0009/design/`.

| Ticket       | Type  | Title                                                                            | Outcome     |
| ------------ | ----- | -------------------------------------------------------------------------------- | ----------- |
| SWHR3-T-0125 | TASK  | Sprint plan — SWHR3-S-0009                                                       | DONE        |
| SWHR3-T-0126 | EPIC  | Supplier Portal and Inventory Management                                         | DONE        |
| SWHR3-T-0127 | STORY | A supplier administrator updates stock and waiting orders are fulfilled/invoiced | DONE        |
| SWHR3-T-0128 | TASK  | Supplier Portal Authentication — supplier role, prefix rule, grant script        | DONE (#101) |
| SWHR3-T-0129 | TASK  | Supplier Order Entity — migration 0007, PO statuses, supplier-side tables        | DONE (#102) |
| SWHR3-T-0130 | TASK  | Contact Information Entity                                                       | DONE (#103) |
| SWHR3-T-0133 | TASK  | Inventory Management — getInventory, updateQuantity                              | DONE (#104) |
| SWHR3-T-0135 | TASK  | Inventory Display Handler — `GET /api/supplier/inventory`                        | DONE (#105) |
| SWHR3-T-0131 | TASK  | Address Entity                                                                   | DONE (#106) |
| SWHR3-T-0132 | TASK  | EJB Relationships — supplier order read model, cascade                           | DONE (#107) |
| SWHR3-T-0139 | TASK  | Supplier Order Creation — PENDING POs with delivery contact/address              | DONE (#108) |
| SWHR3-T-0137 | TASK  | Pending Order Reprocessing                                                       | DONE (#109) |
| SWHR3-T-0138 | TASK  | Invoice Generation                                                               | DONE (#110) |
| SWHR3-T-0141 | TASK  | Form Submission Handler — `parseInventoryForm`                                   | DONE (#111) |
| SWHR3-T-0136 | TASK  | Inventory Update Handler — `applyInventoryUpdate`                                | DONE (#112) |
| SWHR3-T-0134 | TASK  | Request Processing — `POST /api/supplier/inventory`                              | DONE (#113) |
| SWHR3-T-0143 | TASK  | Error Handling and Logging                                                       | DONE (#114) |
| SWHR3-T-0142 | TASK  | Transaction Management (atomicity suite)                                         | DONE (#115) |
| SWHR3-T-0144 | TASK  | Supplier Portal Configuration — shell, sign-in, access denied                    | DONE (#116) |
| SWHR3-T-0140 | TASK  | Inventory Display View — the `/supplier` page                                    | DONE (#117) |
| SWHR3-T-0145 | TASK  | Testing and Validation — e2e, workflow, concurrency                              | DONE (#118) |
| SWHR3-T-0146 | TASK  | Integration QA report — SWHR3-S-0009                                             | DONE (#119) |
| SWHR3-T-0147 | TASK  | Sprint close bundle — SWHR3-S-0009                                               | This ticket |

## What shipped

A supplier portal, plus the supplier side of fulfilment. The code change is 63 files and about 6,440 lines added, most of it tests.

- **Access:**
  - A new `supplier` role, shown as "Supplier administrator", owns every `/api/supplier/` path. Signed out gets 401; customers and store administrators get 403.
  - Operators grant the role with `bun run supplier:grant <username>`.
  - `/supplier/signin` and `/supplier` have their own shell. Anyone else sees "Access denied".
- **Inventory page (`/supplier`):**
  - Every catalogue item with its current quantity, a new-quantity input (`qty_<itemId>`) and a checkbox (`item_<itemId>`). Typing a value ticks the row, and only ticked rows with a whole number of 0 or more are saved; everything else is skipped silently.
  - A banner confirms how many rows were saved, and saved rows are marked.
- **Reprocessing:** each save runs in one transaction with the retry of every PENDING supplier PO. Each PO is all-or-nothing: stock checked, deducted, PO to PROCESSING. A short PO stays PENDING, and every attempt is recorded (`supplier_fulfilment_attempts`) and logged with before/after values.
- **Supplier orders** (migration `drizzle/0007_condemned_pyro.sql`):
  - POs now run `PENDING → PROCESSING → COMPLETED`, migrated from `OPEN`/`SHIPPED`.
  - Approval always creates PENDING POs, each with a delivery contact and address copied from the order's shipping snapshot. These are never shown in the portal.
  - Approval then fulfils immediately where stock allows, so a stocked order still reaches ALLOCATED at approval.
- **Invoices:** shipping a PO (`db/ship-supplier-po.ts`) generates an invoice with lines and total. Delivering it in-process to the order side records shipped quantities and, for the last PO, completes the order.
- **Tests:** unit, route and UI suites; atomicity suites; a two-writer concurrency test; a full-chain workflow test; and `e2e/supplier-portal.spec.ts` with 5 journeys.

**Root docs.** Planning (SWHR3-T-0125) already updated `ARCHITECTURE.md` (supplier API prefix, supplier-side entities, PO lifecycle, invoice-driven completion) and `DESIGN.md` (the Supplier area). The shipped code matches both. At close, `ARCHITECTURE.md` gains the migration rule QA introduced (see Divergence), as a Database note and a Key Decision. `PRODUCT.md` is unchanged: `supplier-integration` is already on the capability map.

## Divergence from plan

- **Two defects found and fixed in place by QA (SWHR3-T-0146):**
  - **Migration 0007 failed on a populated database.** Drizzle's migrator runs inside a transaction, where SQLite ignores `PRAGMA foreign_keys=OFF`, so rebuilding `supplier_purchase_orders` hit its child `line_items`. The in-memory unit database never has rows, so every unit run was green. `db/client.ts` now migrates with foreign keys off, runs `foreign_key_check` (startup fails on a violation), then turns them back on. This protects every future table-rebuild migration. The upgrade path has no automated regression test (see Follow-ups).
  - **An E2E assertion looked for `columnheader`**, which Playwright 1.50.1 does not report for a plain `<th>`. The spec now locates the header cells directly; the page markup was correct.
- **Edits outside ownership maps:**
  - SWHR3-T-0144 widened `SessionUser.role` in `src/hooks/use-session.ts` to include `"supplier"`, a type only.
  - SWHR3-T-0143 added cleanup of `supplier_fulfilment_attempts` to `lib/order-approval.test.ts` and `lib/inventory-update.test.ts`, test-only.
- **Partial coverage by design:** the case links for SWHR3-T-0130 and SWHR3-T-0131 covered their own modules. The copy of the shipping snapshot at PO creation is proven by SWHR3-T-0139, as planned.
- **Small additions:**
  - `parseInventoryForm` also accepts JSON whole numbers as well as strings, and ignores unsafe integers and empty item ids.
  - `processedOrders`/`fulfilledOrders` count every PENDING PO system-wide, per C7.

## Verification

**PASS** at sprint head 1f43a08:

- Lint, typecheck and build are clean. `bun run verify` passes 1014/1014 unit tests.
- Playwright passes 39/39 on both a fresh database and a copy of a previously used one, after the two fixes.

The QA report lists verdicts only for the scenarios the E2E exercises; the remainder are covered by the unit and route suites in the 1014-test run. Two scenarios are marked not-testable:

- **ServiceLocator** is genuinely not applicable. A static-import test covers the equivalent (`lib/supplier-portal.modules.test.ts`).
- **"Invoice is sent to order processing center" is in fact tested.** Delivery is the in-process `receiveInvoice` call (D9, SD3), not JMS, and `lib/invoices.test.ts` and `lib/supplier-fulfilment.workflow.test.ts` assert that shipped quantities are recorded and the order completes. QA's note cites "design.md Open Questions", which is the idea canvas's wording, not the change's decisions.

See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **Not filed, for the next planning pass:**
  - There is no automated test for migrating a _populated_ database: Vitest always starts empty. A test that applies migrations 0000–N to a file database with seeded rows would have caught DEFECT-1 at the ticket that wrote migration 0007.
  - Every supplier save reprocesses PENDING POs system-wide. In E2E, parallel specs can in principle take each other's stock; noted by SWHR3-T-0145, with no failure observed.
- **Still open from earlier sprints:**
  - Human review of the order-workflow PRD conflicts (SD1/SD3 of `swhr3-i-0006-order-processing-and-fulfil`).
  - SWHR3-T-0076, SWHR3-T-0077 and SWHR3-T-0099.
- **Next:** `customer-communications` (`swhr3-i-0011`) delivers `notification_outbox` rows. Nothing in this sprint sends email.
- **Environment:** implementers still cannot run Playwright (Chromium mismatch; eighth sprint). SWHR3-T-0145's spec first ran at QA.

## Retrospective

These points are judgment, not measured fact.

- **Went well:**
  - The mockups settled the portal's role conflict (spec "administrator" versus PRD "supplier staff"), so planning had a visual answer rather than a guess.
  - Re-modelling the PO lifecycle without changing any observable order-workflow behaviour held up. Last sprint's order-workflow E2E stayed green.
  - The C12 status seam (planned PROCESSING at the old call site until SWHR3-T-0137) kept the tree green through the handover between tickets, as intended.
  - Case linking checked against each ticket's dependencies left no ticket blocked on missing code this sprint.
- **Could improve:**
  - The in-memory test database hid a migration bug that only a real upgrade exposes. Any migration that rebuilds a table should be tested against a populated database before it merges.
  - QA again judged a scenario against the idea text rather than the change's rebuild decisions (the second time, after SWHR3-S-0006).
  - The design-export tool failed silently for the second sprint running, and planning recovered the designs by hand. It needs a platform fix.
  - Ownership maps still miss shared type and test files that a new role or table touches (`use-session.ts`, test cleanups).

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                       |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-TASK PLAN.md + exported designs      | `openspec/changes/swhr3-i-0007-supplier-portal-and-invento/`, `artifacts/SWHR3-S-0009/*/PLAN.md` | Satisfied | —                                               |
| Test cases approved and linked   | 43 approved cases linked to TASKs                          | Change Review; ticket links                                                                      | Satisfied | —                                               |
| Every change merged through a PR | Squash-merge commits #101–#119                             | sprint branch history                                                                            | Satisfied | —                                               |
| Tests executed per ticket        | TDD result markers + colocated tests                       | `artifacts/SWHR3-S-0009/*/tdd-test-result.md`                                                    | Satisfied | E2E ran only in QA                              |
| Change verified before release   | QA report, PASS, 39/39 E2E on fresh and upgraded databases | `artifacts/SWHR3-S-0009/qa-test-report.md`                                                       | Satisfied | No mockup comparison                            |
| Defects dispositioned            | 2 found at QA, both fixed in place                         | `integration-defects-resolution.md`                                                              | Satisfied | No regression test for the populated-db upgrade |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided                    |
