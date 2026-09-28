---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0002
idea: Not Applicable
branch: vortex/sprint/swhr3-s-0002-74386212
upstream: [artifacts/SWHR3-S-0002/qa-test-report.md]
---

# Release notes — SWHR3-S-0002

No user-facing changes. This release corrects repository metadata and tooling config.

## Fixed

- `build/manifest.yaml`: every capability's `change.dir` now points at a change directory that exists. Before this fix, all ten pointed at `openspec/changes/sx-*` placeholders that were never created. (SWHR3-T-0023)
- The leftover empty `tailwind.config.ts` is removed, so the repo matches its CSS-first Tailwind v4 convention. Styling is unchanged. (SWHR3-T-0024)

## Changed

- `components.json` `tailwind.config` is now `""`, the value shadcn/ui expects for Tailwind v4 projects. `npx shadcn add …` no longer points at a missing file. (SWHR3-T-0024)

## Upgrade notes

- None. No environment variables, migrations or runtime configuration changed.

## Not included

- Keeping `build/manifest.yaml` in sync when later changes are archived at sprint close. That needs a platform change and is recorded as follow-up F1 in `sprint-summary.md`.

## Verification

Verified at integration QA: PASS. Build, lint, type-check, 273/273 unit tests and 11/11 E2E tests were green, and no defects were found. See `artifacts/SWHR3-S-0002/qa-test-report.md`.

## Compliance / Control Evidence

| Control                                | Evidence        | Location                                   | Status    | Exception |
| -------------------------------------- | --------------- | ------------------------------------------ | --------- | --------- |
| Release contents recorded              | this file       | `artifacts/SWHR3-S-0002/release-notes.md`  | Satisfied | —         |
| Release verified before land           | QA PASS verdict | `artifacts/SWHR3-S-0002/qa-test-report.md` | Satisfied | —         |
| Config and migration changes disclosed | Upgrade notes   | this file                                  | Satisfied | —         |
