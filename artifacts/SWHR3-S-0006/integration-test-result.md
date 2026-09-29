---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0006
idea: SWHR3-I-0005
branch: vortex/sprint/swhr3-s-0006-d6c77f92
downstream: [artifacts/SWHR3-S-0006/qa-test-report.md]
---

# Integration test result — SWHR3-S-0006

## Commands run

`bun install`, `bun run build` (exit 0), then `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e` at sprint-branch head 3b4fdbc. `bunx playwright test --list` shows 32 tests in 7 files, all under `[chromium]`, including the 4 in `e2e/checkout.spec.ts`.

The container's Chromium is build 1223 while pinned Playwright 1.50.1 expects 1155, so the `pretest:e2e` preflight fails on a plain run. `/tmp/pw` holds symlinks named `chromium-1155` and `chromium_headless_shell-1155` pointing at the installed 1223 builds. No repository file was changed.

Playwright summary line: `32 passed (11.6s)`

## Results

| Spec                       | Result   | Notes                                                                                                                                                       |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e/checkout.spec.ts       | 4 passed | [SWHR3-C-0145] signed-out redirect, [SWHR3-C-0144] signed-in checkout to confirmation, blank billing city blocked, [SWHR3-C-0118] cart emptied mid-checkout |
| e2e/cart.spec.ts           | 6 passed |                                                                                                                                                             |
| e2e/customer-auth.spec.ts  | 5 passed |                                                                                                                                                             |
| e2e/db-lock.spec.ts        | 4 passed |                                                                                                                                                             |
| e2e/home.spec.ts           | 3 passed |                                                                                                                                                             |
| e2e/order-approval.spec.ts | 7 passed |                                                                                                                                                             |
| e2e/smoke.spec.ts          | 3 passed |                                                                                                                                                             |

No failures. No skipped tests.

E2E-RESULT: chromium 32 passed, 0 failed, 0 skipped
