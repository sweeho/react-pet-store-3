---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
idea: SWHR3-I-0006
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream:
  [
    artifacts/SWHR3-S-0008/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0008/qa-test-report.md,
    artifacts/SWHR3-S-0008/integration-test-result.md,
    artifacts/SWHR3-S-0008/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0008/release-notes.md]
---

# Sprint summary — SWHR3-S-0008

Sprint goal: "SWHR3-I-0006: Order Processing and Fulfillment Workflow". **Met.** All 14 implementation TASKs reached DONE, and integration QA returned PASS: 16 scenarios pass, 1 is not-testable (ServiceLocator, SD7), and no defects were found.

## Tickets

The plan is change `swhr3-i-0006-order-processing-and-fulfil`. Its `design.md` section "Rebuild on this repository (sprint SWHR3-S-0008)" holds the decisions (D1–D8), contracts (C1–C10) and spec discrepancies (SD1–SD11). Per-ticket detail is in `artifacts/SWHR3-S-0008/<TICKET-KEY>/`.

| Ticket       | Type  | Title                                                                  | Outcome     |
| ------------ | ----- | ---------------------------------------------------------------------- | ----------- |
| SWHR3-T-0106 | TASK  | Sprint plan — SWHR3-S-0008                                             | DONE        |
| SWHR3-T-0107 | EPIC  | Order Processing and Fulfillment Workflow                              | DONE        |
| SWHR3-T-0108 | STORY | A placed order is paid, confirmed, allocated on approval and completed | DONE        |
| SWHR3-T-0120 | TASK  | Order Persistence — schema, migration 0006, finders                    | DONE (#85)  |
| SWHR3-T-0116 | TASK  | Supplier PO Generation                                                 | DONE (#86)  |
| SWHR3-T-0115 | TASK  | Inventory Integration                                                  | DONE (#87)  |
| SWHR3-T-0113 | TASK  | Order Status Management — workflow stages                              | DONE (#88)  |
| SWHR3-T-0114 | TASK  | Order Notifications — confirmation outbox                              | DONE (#89)  |
| SWHR3-T-0112 | TASK  | Payment Processing — no-charge authorizer seam                         | DONE (#90)  |
| SWHR3-T-0117 | TASK  | Order Processing Facade — `processOrder`                               | DONE (#91)  |
| SWHR3-T-0110 | TASK  | Order Creation (regression suite)                                      | DONE (#92)  |
| SWHR3-T-0109 | TASK  | Order Validation (regression suite)                                    | DONE (#93)  |
| SWHR3-T-0111 | TASK  | Line Item Management (regression suite)                                | DONE (#94)  |
| SWHR3-T-0118 | TASK  | Process Manager — allocation, retry, shipment                          | DONE (#95)  |
| SWHR3-T-0121 | TASK  | Error Handling — decline message, diagnostics                          | DONE (#96)  |
| SWHR3-T-0119 | TASK  | EJB Transaction Management (atomicity suite)                           | DONE (#97)  |
| SWHR3-T-0122 | TASK  | Testing — end-to-end workflow, decline, concurrency                    | DONE (#98)  |
| SWHR3-T-0123 | TASK  | Integration QA report — SWHR3-S-0008                                   | DONE (#99)  |
| SWHR3-T-0124 | TASK  | Sprint close bundle — SWHR3-S-0008                                     | This ticket |

## What shipped

An order now moves from placement to completion. The code change is 48 files and about 4,780 lines added, most of it tests.

- **Data:** migration `drizzle/0006_wild_captain_cross.sql`.
  - `orders.workflow_stage` (default `PENDING`) and `order_stage_history` (a timestamp per change).
  - `payment_authorizations`, `notification_outbox`, `inventory`, `inventory_reservations` and `supplier_purchase_orders`.
  - `line_items.supplier_po_id`.
  - `lib/order-records.ts` reads a whole order back.
- **Placement** (`lib/order-processing.ts` `processOrder`, used by `POST /api/orders`) runs in one immediate transaction:
  1. Write the order, contacts and lines.
  2. Authorise payment through the `PaymentAuthorizer` seam. The default contacts nothing and charges nothing; card `4000 0000 0000 0002` always declines. Stage becomes PAID.
  3. Queue an `ORDER_CONFIRMATION` outbox row with the order details, total and ship-to. Stage becomes CONFIRMED.
  4. Empty the cart.

  A decline answers 402 `PAYMENT_DECLINED` and rolls everything back. `/checkout` shows "Your card was declined. No order was placed." with the entered values kept.

- **Allocation on approval.** An administrator's approval calls `allocateOrder` inside the same commit.
  - With enough stock, it decrements inventory, records reservations, creates supplier POs (one per supplier, delivery expected in 7 days) and moves the stage to ALLOCATED.
  - Without enough stock, the order waits at CONFIRMED and the approval still commits.
  - `retryWaitingAllocations()` and `db/allocate-waiting.ts` re-run waiting orders.
- **Shipment.** `recordShipment` and `db/ship-supplier-po.ts` mark a PO shipped with the supplier's tracking number. When every PO of an order has shipped, the stage becomes SHIPPED and the status COMPLETED, through a new system-only APPROVED→COMPLETED rule. Admin transitions are unchanged.
- **Operator scripts:** `db/seed-inventory.ts`, `db/allocate-waiting.ts` and `db/ship-supplier-po.ts`.
- **Tests:** unit and route suites for every module; atomicity suites for placement and allocation; a 10-way concurrency test; and `e2e/order-workflow.spec.ts` with 3 journeys (place, approve + stock + ship → Completed, and decline).

**Root docs are unchanged at close.** Planning (SWHR3-T-0106) already updated `ARCHITECTURE.md` with the workflow entities, `processOrder` as the entry point, fulfilment's APPROVED→COMPLETED and three Key Decisions. The shipped code matches it. No `PRODUCT.md` or `DESIGN.md` trigger fired: `order-workflow` is already on the capability map, and the decline alert reuses the existing Alert pattern.

## Divergence from plan

All divergences are minor and recorded in each ticket's summary.

- **Planning error (T-0119).** T-0119's plan depended on the facade (T-0117), but its allocation case needs `allocateOrder` from T-0118. The implementer blocked; planning moved the dependency to T-0118 and the ticket finished after T-0118 merged.
- **Edits outside ownership maps:**
  - T-0120 edited `lib/line-items.test.ts` twice, because the new `supplier_po_id` column changes the row shape.
  - T-0117 added a small `logOrderPlaced` helper so both entry points share one log line.
- **Tests placed differently:**
  - T-0114 tested the outbox through `queueOrderConfirmation` directly, because `processOrder` did not exist yet. T-0117 re-covers it end to end.
  - T-0121 covered its route-level decline assertion at `processOrder` level, because the route test file belonged to T-0117.
- **Type and wording details:**
  - `listOrdersByStage` takes a plain string, because the stage type landed later.
  - An already-shipped supplier PO raises `InvalidTransitionError` worded "Order <poId> is SHIPPED …", because `lib/errors.ts` was outside T-0116's ownership. See Follow-ups.

## Verification

**PASS** at sprint head f959880:

- `bun run verify` passes 855/855 unit tests, and the build exits 0.
- Playwright passes 35/35, including the 3 order-workflow journeys: the decline path in the browser, and approve → stock → ship → Completed tab.

The ServiceLocator scenario is marked not-testable (SD7). A static-import test (`lib/order-processing.modules.test.ts`) covers the equivalent guarantee.

See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **Needs a human decision (flagged at planning):**
  - Payment never charges (SD1).
  - Stock is reserved at approval, not at placement (SD3).

  Both follow the PRD over the extracted spec. Reversing either needs a PRD change.

- **Not filed; for the next planning pass:** the error for an already-shipped supplier PO says "Order <poId>", naming the wrong entity. Operators see it only through `db/ship-supplier-po.ts`. A PO-specific error message is a one-line fix in `lib/errors.ts`.
- **Next capabilities:**
  - **Supplier-integration** (`swhr3-i-0007`) builds the supplier UI and inventory updates on the tables and `retryWaitingAllocations` built here, and must not recreate them (SD4).
  - **Customer-communications** (`swhr3-i-0011`) delivers `notification_outbox` rows.
- **Not built:**
  - Auto-approval under $500 (SD11).
  - Triggers for the DELIVERED and COMPLETED stages (SD5).
- **Open improvements:** SWHR3-T-0076, SWHR3-T-0077 and SWHR3-T-0099.
- **Environment:** no implementer could run Playwright, because Chromium does not match the pinned version. This is the seventh sprint running.

## Retrospective

These points are judgment, not measured fact.

- **Went well:**
  - Settling the idea's five open questions in the plan (D1–D8), with the PRD as the tie-breaker, meant no ticket had to decide scope. QA passed first time with no defects.
  - Multi-key dependencies set at creation let five component tickets run in parallel. This is the first sprint on this project that was not almost entirely serial.
  - Linking each test case to the ticket that builds the tested surface held up: only T-0114 had to test around a missing facade.
- **Could improve:**
  - Planning missed one real dependency (T-0119 → T-0118) and blocked a ticket mid-sprint. A plan's dependencies should be checked against every test case linked to the ticket, not only its files.
  - Four of 14 TASKs (G1, G2, G3, G11) were regression suites over behaviour that checkout already shipped. The one-TASK-per-group rule cost dispatches here too.
  - The spec extracted from the legacy system contradicted the approved PRD on payment, inventory timing and status. That should be caught before import, not at sprint planning.
  - Ownership maps again missed shared test files touched by schema changes (`lib/line-items.test.ts`) and a shared error module.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                                                |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------ |
| Work planned before execution    | OpenSpec change + per-TASK PLAN.md                         | `openspec/changes/swhr3-i-0006-order-processing-and-fulfil/`, `artifacts/SWHR3-S-0008/*/PLAN.md` | Satisfied | One dependency corrected mid-sprint                                      |
| Test cases approved and linked   | 29 approved cases linked to TASKs                          | Change Review; ticket links                                                                      | Satisfied | —                                                                        |
| Every change merged through a PR | Squash-merge commits #85–#99                               | sprint branch history                                                                            | Satisfied | —                                                                        |
| Tests executed per ticket        | TDD result markers + colocated tests                       | `artifacts/SWHR3-S-0008/*/tdd-test-result.md`                                                    | Satisfied | E2E ran only in QA                                                       |
| Change verified before release   | QA report, PASS, 16 pass / 1 not-testable / 0 fail         | `artifacts/SWHR3-S-0008/qa-test-report.md`                                                       | Satisfied | —                                                                        |
| Defects dispositioned            | 0 at QA                                                    | `integration-defects-resolution.md`                                                              | Satisfied | —                                                                        |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided; SD1/SD3 PRD conflicts await product review |
