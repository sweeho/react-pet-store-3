---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0007
idea: Not Provided
branch: vortex/sprint/swhr3-s-0007-45e84ed1
downstream: [artifacts/SWHR3-S-0007/qa-test-report.md]
---

# Integration test result — SWHR3-S-0007

## Commands run

`bun install`, `bun run build` (exit 0), then `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e` at sprint-branch head 8b48398. All tests run under the single `[chromium]` project.

The container's Chromium is build 1223 while pinned Playwright 1.50.1 expects 1155, so the `pretest:e2e` preflight fails on a plain run. `/tmp/pw` holds symlinks named `chromium-1155` and `chromium_headless_shell-1155` pointing at the installed 1223 builds. No repository file was changed.

Playwright summary line: `32 passed (11.4s)`

## Results

| Spec                       | Result   | Notes                                                               |
| -------------------------- | -------- | ------------------------------------------------------------------- |
| e2e/checkout.spec.ts       | 4 passed | the JSON checkout journey still places an order through the browser |
| e2e/cart.spec.ts           | 6 passed |                                                                     |
| e2e/customer-auth.spec.ts  | 5 passed |                                                                     |
| e2e/db-lock.spec.ts        | 4 passed |                                                                     |
| e2e/home.spec.ts           | 3 passed |                                                                     |
| e2e/order-approval.spec.ts | 7 passed |                                                                     |
| e2e/smoke.spec.ts          | 3 passed |                                                                     |

No failures. No skipped tests.

E2E-RESULT: chromium 32 passed, 0 failed, 0 skipped
