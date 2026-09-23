---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0001
idea: SWHR3-I-0002
branch: vortex/sprint/swhr3-s-0001-a5f84996
upstream:
  [
    artifacts/SWHR3-S-0001/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0001/qa-test-report.md,
    artifacts/SWHR3-S-0001/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0001/release-notes.md]
---

# Sprint summary — SWHR3-S-0001

Sprint goal: "SWHR3-I-0002: Customer Management and Authentication". **Met.** All 16 implementation TASKs reached DONE, and integration QA returned PASS with no defects.

## Tickets

Per-ticket detail is in `artifacts/SWHR3-S-0001/<TICKET-KEY>/summary.md`. PR numbers come from the squash-merge commit subjects on the sprint branch.

| Ticket       | Type  | Title                                                               | Outcome          |
| ------------ | ----- | ------------------------------------------------------------------- | ---------------- |
| SWHR3-T-0001 | TASK  | Sprint plan — SWHR3-S-0001                                          | DONE (`f663c66`) |
| SWHR3-T-0002 | EPIC  | Customer Management and Authentication                              | DONE (rollup)    |
| SWHR3-T-0003 | STORY | Returning and new customers can sign in and register                | DONE (rollup)    |
| SWHR3-T-0004 | STORY | Sessions expire and protected pages require sign-in                 | DONE (rollup)    |
| SWHR3-T-0005 | STORY | Customers create and maintain their profile                         | DONE (rollup)    |
| SWHR3-T-0006 | STORY | Failures surface as clear errors, verified end to end               | DONE (rollup)    |
| SWHR3-T-0007 | TASK  | Sign-on page and sign-in API with remember-my-user-name             | DONE (#13)       |
| SWHR3-T-0008 | TASK  | New-customer registration panel and register API                    | DONE (#14)       |
| SWHR3-T-0009 | TASK  | Sign-on error state on the sign-in page                             | DONE (#18)       |
| SWHR3-T-0010 | TASK  | Session lifecycle: 30-minute idle timeout, default locale, sign-out | DONE (#11)       |
| SWHR3-T-0011 | TASK  | Protected API paths and pages, with return to the requested page    | DONE (#15)       |
| SWHR3-T-0012 | TASK  | Customer, address, card and preference storage                      | DONE (#10)       |
| SWHR3-T-0013 | TASK  | CustomerProfile JSON shape and input parsing                        | DONE (#12)       |
| SWHR3-T-0014 | TASK  | Create-customer page                                                | DONE (#19)       |
| SWHR3-T-0015 | TASK  | Customer profile service, API and account profile page              | DONE (#17)       |
| SWHR3-T-0016 | TASK  | Service errors and HTTP error mapping                               | DONE (#6)        |
| SWHR3-T-0017 | TASK  | Account storage and credential service                              | DONE (#8)        |
| SWHR3-T-0018 | TASK  | Transaction helper for multi-step writes                            | DONE (#9)        |
| SWHR3-T-0019 | TASK  | App error screen and exception-to-screen mapping                    | DONE (#16)       |
| SWHR3-T-0020 | TASK  | Auth configuration and the lib/ server-module harness               | DONE (#5)        |
| SWHR3-T-0021 | TASK  | Form primitives, validators and API client                          | DONE (#7)        |
| SWHR3-T-0022 | TASK  | Sign-on, registration and profile verified end to end               | DONE (#20)       |
| SWHR3-T-0025 | TASK  | Integration QA report — SWHR3-S-0001                                | DONE (#21)       |
| SWHR3-T-0026 | TASK  | Sprint close bundle — SWHR3-S-0001                                  | This ticket      |

## What shipped

The repo moved from a hardcoded user (`{ name: "Yeasin" }` in `middleware/auth.ts`) to real customer identity. The standing description is in `ARCHITECTURE.md` §Authentication and sessions and §Database, and in `DESIGN.md` §Forms.

- **Identity and credentials:** an `accounts` table with argon2id password hashes, plus register and sign-in APIs with duplicate user-name detection (T-0017, T-0008, T-0007).
- **Session:** sealed-cookie session with a 30-minute sliding idle timeout, a default locale and sign-out. Expired and never-signed-in sessions are distinguishable (T-0010).
- **Protection:** one enforcement point in `middleware/auth.ts` backed by an exact-match API path list, a client route guard, and return to the requested page after sign-in (T-0011).
- **Profile:** `customers` and `credit_cards` tables with a two-step registration flow (`/signin` → `/users/create`). The profile page at `/users/profile` supports read and update; the user name is read-only and the card is shown masked (T-0012, T-0013, T-0014, T-0015).
- **Shared foundations for later capabilities:** `lib/` server modules, typed service errors mapped through `toHttpError`, `withTransaction`, six form primitives, and the `apiFetch` client (T-0016, T-0018, T-0020, T-0021).
- **Failure handling:** the designed sign-on error banner and an app-level error boundary with an error screen (T-0009, T-0019).
- **End-to-end proof:** five Playwright journeys, plus concurrency and idle-timeout integration tests (T-0022).

## Divergence from plan

Delivery followed the 16-TASK plan in `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` §Ticket map. The minor deviations below were each recorded on the owning ticket's `PLAN.md` under the minor-deviation protocol:

- T-0008 added `aria-label="Returning customer"` to the existing panel. Both sign-in panels use the same field labels, which made label-based test queries ambiguous.
- T-0013 and T-0020 each added one file to `tsconfig.node.json`'s `include`, which the composite type-check needs for the mirror parity tests.
- T-0014 and T-0015 render State/Province and Country as text inputs, not the chevron selects shown in the mockup, because the data model has no enum for either. T-0014 makes Favourite category required at the create step, while the API still accepts it blank.
- T-0019 returns `getErrorScreen(...).screen` but does not wire the `signin` branch to a redirect. The error boundary always renders the one error screen.

## Verification

**PASS.** 33/33 delta-spec scenarios pass, and 268 unit/integration tests plus 11/11 Playwright tests are green on the integrated branch. No integration defects were found. See `qa-test-report.md` and `integration-defects-resolution.md`.

## Defects Raised

Both defects were filed by planning during Stage 0 investigation. Both are out of scope for this sprint and carry no sprint.

| Ticket       | Description                                                                                                                        | Filed by | Status  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| SWHR3-T-0023 | `build/manifest.yaml` `change.dir` paths point at OpenSpec changes that do not exist                                               | planning | REFINED |
| SWHR3-T-0024 | An empty `tailwind.config.ts` exists, contradicting the CSS-first Tailwind convention that `ARCHITECTURE.md` and `AGENTS.md` state | planning | REFINED |

## Retrospective

These points are judgment, not measured fact.

- **Went well:** fixed interface contracts (C1–C16 in `design.md`) let parallel TASKs build against each other's modules with no rework. For example, T-0014 mocked `POST /api/customers` while T-0015 built it, and QA found no seam defects.
- **Went well:** the spec-discrepancy table (SD1–SD22) settled every legacy J2EE scenario up front, so QA verdicts on EJB, JNDI and `.do` scenarios were mechanical rather than argued per ticket.
- **Could improve:** no implementation container had a usable Chromium, so no E2E spec ran before CI. T-0022's `customer-auth.spec.ts` shipped a substring-match selector bug (`getByLabel("User name")` also matched "Remember my user name") that only CI caught. QA also had to install a Chromium matching `@playwright/test@1.50.1`. Provisioning the pinned Chromium in agent containers would move that feedback left.
- **Could improve:** 16 TASKs is a lot for one capability. Several (T-0012/T-0013, T-0016/T-0018/T-0020) were narrow foundation slices that one agent could have carried together. Future capabilities reuse these foundations, so they should need fewer tickets.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                                            |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-ticket PLAN.md                       | `openspec/changes/swhr3-i-0002-customer-management-and-aut/`, `artifacts/SWHR3-S-0001/*/PLAN.md` | Satisfied | —                                                                    |
| Every change merged through a PR | Squash-merge commits #5–#21                                | sprint branch history                                                                            | Satisfied | —                                                                    |
| Tests executed per ticket        | TDD result markers                                         | `artifacts/SWHR3-S-0001/*/tdd-test-result.md`                                                    | Satisfied | Implementation containers could not run E2E; E2E ran in CI and at QA |
| Change verified before release   | QA report, PASS, 33/33 scenarios                           | `artifacts/SWHR3-S-0001/qa-test-report.md`                                                       | Satisfied | —                                                                    |
| Defects dispositioned            | 0 found at QA; 2 raised at planning, open in backlog       | `integration-defects-resolution.md`, SWHR3-T-0023, SWHR3-T-0024                                  | Satisfied | —                                                                    |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided                                         |
