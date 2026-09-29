---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0005
idea: SWHR3-I-0004
branch: vortex/sprint/swhr3-s-0005-f1ca395a
downstream: [artifacts/SWHR3-S-0005/qa-test-report.md]
---

# Integration test result — SWHR3-S-0005

## Commands run

`bun install` then `bun run build` (exit 0), then `bun run test:e2e` at sprint-branch head 5efaedf (a single `chromium` project; `bunx playwright test --list` shows all 28 tests, including the 6 in `e2e/cart.spec.ts`, under `[chromium]`).

The container's Chromium is build 1223 while the pinned Playwright 1.50.1 looks for build 1155, so the `pretest:e2e` preflight failed. I ran with `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, a directory of symlinks named `chromium-1155` and `chromium_headless_shell-1155` pointing at the installed 1223 builds. No repository file was changed. Effective command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e`.

Playwright summary line: `28 passed (12.0s)`

## Results

| Spec                       | Result   | Notes                                                                                                                                                                                    |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e/cart.spec.ts           | 6 passed | [SWHR3-C-0090] full journey, [SWHR3-C-0054] persistence, [SWHR3-C-0066] negative qty, [SWHR3-C-0097] letters in qty, [SWHR3-C-0045] empty via API, [SWHR3-C-0092] empty checkout blocked |
| e2e/customer-auth.spec.ts  | 5 passed |                                                                                                                                                                                          |
| e2e/db-lock.spec.ts        | 4 passed |                                                                                                                                                                                          |
| e2e/home.spec.ts           | 3 passed |                                                                                                                                                                                          |
| e2e/order-approval.spec.ts | 7 passed |                                                                                                                                                                                          |
| e2e/smoke.spec.ts          | 3 passed |                                                                                                                                                                                          |

No failures. No skipped tests.

E2E-RESULT: chromium 28 passed, 0 failed, 0 skipped
