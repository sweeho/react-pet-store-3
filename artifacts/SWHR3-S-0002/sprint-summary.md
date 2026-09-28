---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0002
idea: Not Applicable
branch: vortex/sprint/swhr3-s-0002-74386212
upstream:
  [
    artifacts/SWHR3-S-0002/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0002/qa-test-report.md,
    artifacts/SWHR3-S-0002/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0002/release-notes.md]
---

# Sprint summary — SWHR3-S-0002

Sprint goal: "Bugfix — SWHR3-T-0023, SWHR3-T-0024". **Met.** Both defects reached DONE, and integration QA returned PASS with no defects.

## Tickets

Root cause and fix for each defect are in `artifacts/SWHR3-S-0002/<TICKET-KEY>/fix-note.md`. The plan is in change `swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t`.

| Ticket       | Type   | Title                                                                                | Outcome          |
| ------------ | ------ | ------------------------------------------------------------------------------------ | ---------------- |
| SWHR3-T-0028 | TASK   | Bugfix plan — SWHR3-S-0002                                                           | DONE (`9875304`) |
| SWHR3-T-0023 | DEFECT | `build/manifest.yaml` `change.dir` paths point at OpenSpec changes that do not exist | DONE (#23)       |
| SWHR3-T-0024 | DEFECT | Empty `tailwind.config.ts` contradicts the CSS-first Tailwind convention             | DONE (#24)       |
| SWHR3-T-0029 | TASK   | Integration QA report — SWHR3-S-0002                                                 | DONE (#25)       |
| SWHR3-T-0030 | TASK   | Sprint close bundle — SWHR3-S-0002                                                   | This ticket      |

## What shipped

Both fixes are repository metadata and tooling config. Neither changes product behaviour.

- **Manifest paths (T-0023):** every `change.dir` in `build/manifest.yaml` now names a change directory that exists. `customer-management` points at its archived directory. A new regression test, `src/utils/manifest-change-dirs.test.ts`, fails if any `change.dir` is missing or is an `sx-` placeholder.
- **Tailwind CSS-first (T-0024):** the empty `tailwind.config.ts` is deleted, and `components.json` `tailwind.config` is `""`, the value shadcn/ui documents for Tailwind v4. A new regression test, `src/utils/tailwind-config-convention.test.ts`, holds both.

Root docs are unchanged. No capability, architecture or design-system change fired a trigger. `ARCHITECTURE.md` already said there is no `tailwind.config.ts`, and the repo now matches that.

## Divergence from plan

Two small divergences:

- The triage table for T-0023 mapped `customer-management` to `openspec/changes/swhr3-i-0002-…`. That directory had been archived at the SWHR3-S-0001 close, so planning corrected the target to the archive path (design decision D1) before execution began.
- Each defect's owner added a regression test that the plan had not asked for. Both tests are in scope.

## Verification

**PASS.** The change sets `skip_specs: true`, so there are no scenarios to verify. The build succeeds, 273/273 unit tests pass (including the two new regression tests), and 11/11 Playwright tests pass on the integrated branch. No integration defects were found. See `qa-test-report.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **F1 (not filed):** sprint-close archiving moves `openspec/changes/<id>` into `archive/` without rewriting `build/manifest.yaml`. Each remaining `change.dir` will go stale when its capability ships, and when that happens the new regression test from T-0023 will fail. The durable fix belongs in the platform's archive/land step: rewrite `change.dir`, or key the manifest on the change id. Planning has no authority to file defects, so this needs someone who can file it.

## Retrospective

These points are judgment, not measured fact.

- **Went well:** re-verifying the triage evidence at planning caught the archived customer-management path before execution. Without that check the fix would have swapped one missing path for another.
- **Went well:** `skip_specs: true` let a config-only change pass strict validation without inventing a requirement, and QA recorded a clear N/A verdict for scenarios.
- **Could improve:** the T-0024 container again had no Chromium, so the "styles unchanged" outcome relied on build output until QA ran E2E. This repeats the SWHR3-S-0001 finding and is still open.
- **Could improve:** the ticket-update tool strips any line containing `design.md` as a root-doc reference, because it matches case-insensitively against `DESIGN.md`. Ticket descriptions had to cite the change's design doc indirectly. The filter should match root-level paths only.
- **Could improve:** the T-0023 regression test pins paths that the platform moves at each sprint close. Until F1 is fixed, expect that test to fail the first sprint that archives another `swhr3-i-*` change.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                                  |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ---------------------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-defect PLAN.md                       | `openspec/changes/swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t/`, `artifacts/SWHR3-S-0002/*/PLAN.md` | Satisfied | —                                                          |
| Every change merged through a PR | Squash-merge commits #23–#25                               | sprint branch history                                                                            | Satisfied | —                                                          |
| Tests executed per ticket        | TDD result markers + regression tests                      | `artifacts/SWHR3-S-0002/*/tdd-test-result.md`                                                    | Satisfied | Implementation containers could not run E2E; E2E ran at QA |
| Change verified before release   | QA report, PASS                                            | `artifacts/SWHR3-S-0002/qa-test-report.md`                                                       | Satisfied | No scenarios (`skip_specs`)                                |
| Defects dispositioned            | 0 found at QA; F1 recorded as follow-up                    | `integration-defects-resolution.md`, this file                                                   | Satisfied | F1 not filed (planning cannot file defects)                |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided                               |
