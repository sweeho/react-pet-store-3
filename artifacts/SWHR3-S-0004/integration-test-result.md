---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0004
idea: Not Provided
branch: vortex/sprint/swhr3-s-0004-d0e44038
downstream: [artifacts/SWHR3-S-0004/qa-test-report.md]
---

# Integration test result — SWHR3-S-0004

## Commands run

`bun install` (exit 0), `bun run build` (exit 0), then `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --project=chromium` (exit 0).

The `bun run test:e2e` preflight refused to run: it expects Chromium revision 1155 at `/ms-playwright/chromium-1155`, and the container ships revision 1223. I symlinked the 1223 directories to 1155 names under `/tmp/pw` (outside the repo, nothing installed) and ran the same `playwright test` command against them. `bunx playwright test --list` shows all 22 tests belong to the single `chromium` project.

Summary line, verbatim: `22 passed (9.3s)`

## Results

| Spec                       | Passed | Failed | Skipped | Notes                                 |
| -------------------------- | ------ | ------ | ------- | ------------------------------------- |
| e2e/db-lock.spec.ts        | 4      | 0      | 0       | SWHR3-C-0036, C-0037, C-0039, C-0040  |
| e2e/order-approval.spec.ts | 7      | 0      | 0       | ran with the retries override removed |
| e2e/customer-auth.spec.ts  | 5      | 0      | 0       |                                       |
| e2e/home.spec.ts           | 3      | 0      | 0       |                                       |
| e2e/smoke.spec.ts          | 3      | 0      | 0       |                                       |

No spec file ran zero tests.

E2E-RESULT: chromium 22 passed, 0 failed, 0 skipped
