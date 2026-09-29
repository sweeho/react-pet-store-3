---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0047
branch: vortex/feat/SWHR3-T-0047-testing-and-validation-order-approval-e2-cd8035c4
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0047/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0047: Testing and Validation

## What changed

Added the seed script, a 7-test order-approval Playwright spec, and made the manifest regression test accept archived change directories.

## Files

- `db/seed-orders.ts` (new) — `--username`, `--count`, `--status`; inserts orders of $500+ and prints `{"orderIds":[...]}`.
- `e2e/order-approval.spec.ts` (new) — journeys per the ticket AC plus `SWHR3-C-0005`, `-0028`, `-0035`.
- `src/utils/manifest-change-dirs.test.ts` — `changeDirResolves` helper (stated path or `archive/<YYYY-MM-DD>-<basename>`, `sx-` always rejected) with its own fixture tests.

## AC coverage

- AC-1 to AC-4 — one spec test each (see `tdd-test-result.md`); AC-5 by per-test accounts and seed ids; AC-6 by the `changeDirResolves` tests and the manifest check.

## Verification

```
$ bun run verify  -> 71 files, 443 tests passed
$ PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e -> 18 passed
$ ... order-approval.spec.ts --repeat-each=4 (twice) -> all passed, 1-2 flaky retried
```

## Notes

- The container lacks Playwright's expected Chromium build; a symlinked `PLAYWRIGHT_BROWSERS_PATH` (outside the repo) let the E2E run locally.
- Real defect found: `db/client.ts` sets no `busy_timeout`, so the server answers 500 `database is locked` when a spawned script holds the write lock. The spec uses `retries: 3` and script-spawn retries as a stopgap; follow-up defect raised.
- The UI shows "1 decision staged, not yet sent", not the case text "1 uncommitted change"; the test asserts the real copy (design.md D10).
- `a2a_run_tests` is unavailable (no `testEvidence` block); the `TDD-RESULT` marker is the evidence.
