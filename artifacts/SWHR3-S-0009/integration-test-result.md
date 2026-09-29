---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0009
idea: SWHR3-I-0007
branch: vortex/sprint/swhr3-s-0009-cffad66f
downstream: [artifacts/SWHR3-S-0009/qa-test-report.md]
---

# Integration test result — SWHR3-S-0009

## Commands run

`bun install`, `bun run build` (exit 0), then `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e` at sprint-branch head 1f43a08 plus the two fixes for DEFECT-1 and DEFECT-2. All tests run under the single `[chromium]` project.

The container's Chromium is build 1223 while pinned Playwright 1.50.1 expects 1155, so the `pretest:e2e` preflight fails on a plain run. `/tmp/pw` holds symlinks named `chromium-1155` and `chromium_headless_shell-1155` pointing at the installed 1223 builds.

Runs, in order:

| Run                   | Database                                                                      | Outcome                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1, unfixed head       | `sqlite.db` left by the previous sprint (migrations 0000-0006, 1 supplier PO) | `Error: Timed out waiting 120000ms from config.webServer`, 0 tests ran (DEFECT-1)                                             |
| 2, DEFECT-1 fixed     | same database                                                                 | `1 failed`, `38 passed (18.7s)`; failure is [SWHR3-C-0186] (DEFECT-2)                                                         |
| 3, DEFECT-2 diagnosed | fresh database                                                                | [SWHR3-C-0186] alone fails again, and a 2-run repeat on the old database failed both times, so it is deterministic, not flaky |
| 4, both fixed         | fresh database                                                                | `39 passed (15.7s)`                                                                                                           |
| 5, both fixed         | the stale upgrade database again                                              | `39 passed (16.1s)`                                                                                                           |

Final Playwright summary line (run 4): `39 passed (15.7s)`

## Results

| Spec                        | Result   | Notes                                                                                                                                                                                                 |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e/supplier-portal.spec.ts | 4 passed | [SWHR3-C-0186] inventory table, [SWHR3-C-0188] admin sees Access denied, [SWHR3-C-0211] negative quantity leaves item unchanged, [SWHR3-C-0218] waiting order fulfilled by stock update and completed |
| e2e/order-workflow.spec.ts  | 3 passed |                                                                                                                                                                                                       |
| e2e/checkout.spec.ts        | 4 passed |                                                                                                                                                                                                       |
| e2e/cart.spec.ts            | 6 passed |                                                                                                                                                                                                       |
| e2e/customer-auth.spec.ts   | 5 passed |                                                                                                                                                                                                       |
| e2e/db-lock.spec.ts         | 4 passed |                                                                                                                                                                                                       |
| e2e/home.spec.ts            | 3 passed |                                                                                                                                                                                                       |
| e2e/order-approval.spec.ts  | 7 passed |                                                                                                                                                                                                       |
| e2e/smoke.spec.ts           | 3 passed |                                                                                                                                                                                                       |

No failures and no skipped tests in the final run. Failure history is in `integration-defects-resolution.md`.

E2E-RESULT: chromium 39 passed, 0 failed, 0 skipped
