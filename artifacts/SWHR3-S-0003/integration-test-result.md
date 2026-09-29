---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0003
idea: SWHR3-I-0003
branch: vortex/sprint/swhr3-s-0003-21038629
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Integration test result — SWHR3-S-0003

## Commands run

```
bun install && bun run build            # exit 0
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --project=chromium --reporter=list
```

`bun run test:e2e` was refused by its `pretest:e2e` preflight: the repo pins `@playwright/test ~1.50.0` (expects `/ms-playwright/chromium-1155`) but the container ships `chromium-1223` (for Playwright 1.60). I symlinked `chromium-1155` and `chromium_headless_shell-1155` in `/tmp/pw` to the installed 1223 builds, outside the repo, and ran `playwright test` directly against the served dev build on :5178. `bunx playwright test --list` shows all 18 tests in 4 files under the single `chromium` project.

Summary line: `18 passed (8.8s)`

## Results

| Spec                       | Tests | Result   | Notes                                                            |
| -------------------------- | ----- | -------- | ---------------------------------------------------------------- |
| e2e/order-approval.spec.ts | 7     | 7 passed | stage/commit/refresh-warning/atomic-failure/non-admin 403/cookie |
| e2e/customer-auth.spec.ts  | 5     | 5 passed |                                                                  |
| e2e/home.spec.ts           | 3     | 3 passed |                                                                  |
| e2e/smoke.spec.ts          | 3     | 3 passed |                                                                  |

No spec file ran zero tests; no skips, no retries reported in the output.

E2E-RESULT: chromium 18 passed, 0 failed, 0 skipped
