---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0002
idea: Not Applicable
branch: vortex/sprint/swhr3-s-0002-74386212
downstream: [artifacts/SWHR3-S-0002/qa-test-report.md]
---

# Integration test result — SWHR3-S-0002

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium
$ bunx playwright install chromium
$ bun run test:e2e -- --project=chromium
```

`playwright.config.ts` declares a single Playwright project, `chromium`, and `--list` confirmed it
covers all 3 spec files / 11 tests in `e2e/` — no second project selection was needed.

The container had Chromium `1223` pre-installed, but the pinned `@playwright/test@~1.50.0`
(`playwright-core@1.50.1`) resolves to build `1155`, which `scripts/ensure-playwright-browser.mjs`
correctly flagged as missing at `/ms-playwright/chromium-1155/...`. Ran `bunx playwright install
chromium` to fetch the matching build (per the preflight's own instructions) before the real run.
This is a container/browser-cache mismatch, not a defect in the sprint's changes — SWHR3-T-0023 and
SWHR3-T-0024 touch no browser or Playwright configuration.

## Results

| Spec                                                                                   | Result | Notes |
| -------------------------------------------------------------------------------------- | ------ | ----- |
| `e2e/customer-auth.spec.ts` — register/sign-out/sign-in, remember-username prefill     | pass   | 2.0s  |
| `e2e/customer-auth.spec.ts` — signed-out visit to /users/profile redirects and returns | pass   | 1.1s  |
| `e2e/customer-auth.spec.ts` — wrong password shows exact sign-on error                 | pass   | 1.3s  |
| `e2e/customer-auth.spec.ts` — duplicate user name shows taken-user-name message        | pass   | 1.3s  |
| `e2e/customer-auth.spec.ts` — failed profile load renders error screen                 | pass   | 404ms |
| `e2e/home.spec.ts` — shows hero content and desktop nav                                | pass   | 729ms |
| `e2e/home.spec.ts` — no vertical scrollbar on common viewport sizes                    | pass   | 621ms |
| `e2e/home.spec.ts` — opens/closes mobile nav from hamburger button                     | pass   | 481ms |
| `e2e/smoke.spec.ts` — home page loads with no console errors                           | pass   | 344ms |
| `e2e/smoke.spec.ts` — the API responds                                                 | pass   | 321ms |
| `e2e/smoke.spec.ts` — a database-backed route responds                                 | pass   | 64ms  |

Playwright summary: `11 passed (4.9s)`

E2E-RESULT: chromium 11 passed, 0 failed, 0 skipped
