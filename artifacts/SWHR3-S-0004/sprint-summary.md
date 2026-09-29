---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0004
idea: Not Provided
branch: vortex/sprint/swhr3-s-0004-d0e44038
upstream:
  [
    artifacts/SWHR3-S-0004/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0004/qa-test-report.md,
    artifacts/SWHR3-S-0004/integration-test-result.md,
    artifacts/SWHR3-S-0004/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0004/release-notes.md]
---

# Sprint summary — SWHR3-S-0004

Sprint goal: "Bugfix — SWHR3-T-0048: Server answers 500 "database is locked" when another process writes sqlite.db". **Met.** The one DEFECT reached DONE, and integration QA returned PASS: all 4 scenarios passed and no defects were found.

## Tickets

The plan is change `swhr3-s-0004-bugfix-swhr3-t-0048-server`. Its `design.md` holds the root cause, the measured repro and decisions D1–D4. The fix steps and outcome are in `artifacts/SWHR3-S-0004/SWHR3-T-0048/` (`PLAN.md`, `fix-note.md`, `tdd-test-result.md`).

| Ticket       | Type   | Title                                                                         | Outcome     |
| ------------ | ------ | ----------------------------------------------------------------------------- | ----------- |
| SWHR3-T-0051 | TASK   | Bugfix plan — SWHR3-S-0004                                                    | DONE        |
| SWHR3-T-0048 | DEFECT | Server answers 500 "database is locked" when another process writes sqlite.db | DONE (#41)  |
| SWHR3-T-0052 | TASK   | Integration QA report — SWHR3-S-0004                                          | DONE (#42)  |
| SWHR3-T-0053 | TASK   | Sprint close bundle — SWHR3-S-0004                                            | This ticket |

## What shipped

- **Root cause:** Bun's `bun:sqlite` opens connections with `busy_timeout = 0` and `journal_mode = delete`. `db/client.ts` set neither, and it ran `migrate()` at import. So a lock held by another process (the `admin:grant` or `db/seed-orders.ts` scripts, or a second instance) failed in 0 ms, and the route answered 500. Planning reproduced this with two Bun processes: a contended write failed in 0 ms, and with a 5000 ms timeout the same write waited about 1.15 s and succeeded.
- **Fix:** `db/client.ts` exports `openDatabase(file)`. It sets `busy_timeout = 5000` first, then WAL mode on a file-backed database (skipped for `:memory:`), then `foreign_keys = ON`. The shared connection is built through it before drizzle, `migrate()` and the seed run.
- **Tests:**
  - `lib/db-client.test.ts` covers SWHR3-C-0041 (the pragmas), C-0038 (a write waits for another process's lock, then succeeds) and C-0042 (a lock held longer than 5 s fails after about 5 s).
  - The new `e2e/db-lock.spec.ts` covers C-0036, C-0037, C-0039 and C-0040.
  - `e2e/order-approval.spec.ts` no longer has its `retries: 3` workaround.
- **Spec:** the ADDED requirement "Database lock contention tolerance" (SWHR3-R-0015) joins `order-approval` when the platform merges the specs at sprint close.

Root docs are unchanged at close. Planning (SWHR3-T-0051) already added the connection lock policy to `ARCHITECTURE.md` (a Database bullet and a Key Decision), and it matches the shipped code. `PRODUCT.md` and `DESIGN.md` had no trigger. The close ticket asked for a dated Changelog entry, but the planning role rules forbid new changelog entries in root docs, so none was added; the commit history records the change.

## Divergence from plan

- **Ownership map widened.** The plan listed only `lib/db-client.test.ts` and `e2e/order-approval.spec.ts`. The approved cases C-0036, C-0037 and C-0040 need a server-level test that holds a lock from a separate process, so implementation added `e2e/db-lock.spec.ts`. Planning had flagged this gap when the cases were drafted but did not update the ticket.
- **E2E not run by implementation.** The implementation container had no usable Chromium. `db-lock.spec.ts` was run request-only through a temporary config (8 passed with `--repeat-each=2`). The order-approval spec repeated four times with no retries was left to QA. QA ran the full suite once: 22/22 passed, including all 7 order-approval tests with no retries override. QA did not repeat the suite four times.

## Verification

**PASS.**

- `bun run verify`: 446/446 unit tests passed across 72 files.
- Playwright: 22/22 passed, 0 skipped, including the 4 new `db-lock` tests.
- All 4 scenarios passed.
- Coverage was not measured because `@vitest/coverage-v8` is not installed.

See `qa-test-report.md` and `integration-test-result.md`.

## Follow-ups / out of scope

- **Environment (not filed, fourth sprint running):** the repo pins `@playwright/test ~1.50`, which expects chromium-1155, but containers ship chromium-1223. `bun run test:e2e`'s preflight therefore refuses to run, and QA again ran Playwright through a symlinked browser path outside the repo.
- **Coverage tooling:** none is installed, so coverage regression cannot be measured.
- **`a2a_run_tests`:** it still refuses to record red/green runs, because `.vortex/config.yaml` has no `testEvidence` block.
- **Leftover mitigations:** `runBun`'s retry loop in `e2e/order-approval.spec.ts` and `db/seed-orders.ts`'s own `busy_timeout = 10000` are now redundant. They were left in place on purpose (design.md D4).

## Retrospective

These points are judgment, not measured fact.

- **Went well:** reproducing the defect in isolation before planning turned a "not reproduced" triage hypothesis into a measured root cause. The fix matched the plan exactly, and QA was green on its first run.
- **Went well:** one DEFECT, one change and one ticket kept the sprint small. It went from plan to QA PASS in about 20 minutes.
- **Could improve:** planning noticed that the ticket's file list did not cover the approved cases, but left it unchanged. Implementation had to widen the list on its own. The plan should be re-cut as soon as the cases are approved.
- **Could improve:** the Chromium revision mismatch cost every implementation container its E2E tier again. It needs a filed ticket, either pinning Playwright to the shipped revision or relaxing the preflight, rather than another retrospective note.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                                   | Status    | Exception                                   |
| -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-DEFECT PLAN.md                       | `openspec/changes/swhr3-s-0004-bugfix-swhr3-t-0048-server/`, `artifacts/SWHR3-S-0004/SWHR3-T-0048/PLAN.md` | Satisfied | —                                           |
| Every change merged through a PR | Squash-merge commits #41–#42                               | sprint branch history                                                                                      | Satisfied | —                                           |
| Tests executed per ticket        | TDD red/green markers + colocated tests                    | `artifacts/SWHR3-S-0004/SWHR3-T-0048/tdd-test-result.md`                                                   | Satisfied | `a2a_run_tests` unavailable; E2E at QA only |
| Change verified before release   | QA report, PASS, 4/4 scenarios                             | `artifacts/SWHR3-S-0004/qa-test-report.md`                                                                 | Satisfied | Coverage not measured                       |
| Defects dispositioned            | 0 at QA                                                    | `artifacts/SWHR3-S-0004/integration-defects-resolution.md`                                                 | Satisfied | —                                           |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                                        | Satisfied | Human approver: Not Provided                |
