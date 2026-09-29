---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0047
branch: vortex/feat/SWHR3-T-0047-testing-and-validation-order-approval-e2-cd8035c4
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0047/PLAN.md]
---

# TDD result — SWHR3-T-0047

## Test cases

| Test                                                                                                                                             | Covers       | Intent                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------- |
| `e2e/order-approval.spec.ts › [SWHR3-C-0005] an admin stages one order as APPROVED in the browser`                                               | SWHR3-C-0005 | select row, Approve selected: cell reads APPROVED, marked Staged, commit bar counts 1  |
| `e2e/order-approval.spec.ts › stages APPROVED on one order and DENIED on two, commits, ...`                                                      | AC-1         | full commit through the dialog; orders move to Approved/Denied tabs, gone from Pending |
| `e2e/order-approval.spec.ts › the refresh warning keeps staged decisions on cancel and discards them on 'Refresh anyway'`                        | AC-2         | cancel keeps staging; confirm clears it and the order is PENDING again                 |
| `e2e/order-approval.spec.ts › a batch containing an order decided behind the page fails ...`                                                     | AC-3         | failure alert quotes server message; other orders stay PENDING                         |
| `e2e/order-approval.spec.ts › a non-admin sees the not-an-administrator state and the admin API answers 403`                                     | AC-4         | UI state plus 403 on GET /api/admin/orders                                             |
| `e2e/order-approval.spec.ts › [SWHR3-C-0035] Refresh with nothing staged shows an order approved behind the page under Approved`                 | SWHR3-C-0035 | refresh reloads all groups                                                             |
| `e2e/order-approval.spec.ts › [SWHR3-C-0028] sign-in issues the httpOnly SameSite=Lax session cookie ...`                                        | SWHR3-C-0028 | Set-Cookie flags; /api/session returns role admin                                      |
| `src/utils/manifest-change-dirs.test.ts › changeDirResolves` (5 tests) + `names a directory that exists on disk, at its stated path or archived` | AC-6         | stated path, dated archive, neither, undated archive, sx- placeholder                  |

AC-5 (ids only from the test's own seed call) holds by construction: every test registers its own account, seeds its own orders and addresses rows by returned ids. Verified by `--repeat-each=4` runs against the persistent database with parallel workers.

`a2a_run_tests` is unavailable for this project (no `testEvidence` block in `.vortex/config.yaml`), so the marker below is the evidence.

## Red run

Run against the working tree before `db/seed-orders.ts` existed and before the manifest helper was implemented (not committed separately):

```
$ bun run test src/utils/manifest-change-dirs.test.ts   (helper stubbed with VortexNotImplemented)
 Tests  6 failed | 2 passed (8)

$ PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e e2e/order-approval.spec.ts   (no seed script)
  5 failed, 2 passed   # 5 fail: 'Module not found "db/seed-orders.ts"'; the 2 that
                       # never seed (C-0028, non-admin) passed
```

## Green run

Playwright's Chromium 1155 is absent from this container but a Chromium build sits at `/ms-playwright/chromium-1223`; running with `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw` (symlinks named `chromium-1155` and `chromium_headless_shell-1155` to the 1223 builds, outside the repo) let the real E2E tier run here.

```
$ bun run verify                 -> Test Files 71 passed, Tests 443 passed (lint, typecheck clean)
$ PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e   -> 18 passed (all specs)
$ ... e2e/order-approval.spec.ts --repeat-each=4      -> 27 passed, 1 flaky ; 26 passed, 2 flaky
```

Flakes are `database is locked` 500s from the dev server (see the follow-up defect in summary.md); the spec's `retries: 3` absorbs them.

TDD-RESULT: 443 passed, 0 failed
