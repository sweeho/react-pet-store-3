---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0001
idea: SWHR3-I-0002
branch: vortex/sprint/swhr3-s-0001-a5f84996
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Integration test result — SWHR3-S-0001

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed a single "chromium" project covers all 3 spec files (11 tests)
$ bun run test:e2e -- --project=chromium
```

Chromium was not pre-installed at the version `@playwright/test@1.50.1` (this repo's pinned version)
expects (`chromium-1155`); the container ships `chromium-1223`. Ran `bunx playwright install chromium`
to fetch the matching build, then re-ran the suite. CI installs its own matching Chromium in a fresh
runner (`.github/workflows/ci.yml`: `bunx playwright install --with-deps chromium`), so this is a
QA-container provisioning quirk, not a product defect — noted in `qa-test-report.md`, not filed as a
DEFECT.

## Results

| Spec                                                                                                                                             | Result | Notes |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----- |
| `e2e/customer-auth.spec.ts › register, complete the profile, sign out, sign back in with Remember my user name, and find it prefilled next time` | pass   | 2.1s  |
| `e2e/customer-auth.spec.ts › a signed-out visit to /users/profile redirects to /signin and returns there after signing in`                       | pass   | 1.1s  |
| `e2e/customer-auth.spec.ts › a wrong password shows the exact sign-on error message`                                                             | pass   | 1.3s  |
| `e2e/customer-auth.spec.ts › a duplicate user name shows the taken-user-name message`                                                            | pass   | 1.3s  |
| `e2e/customer-auth.spec.ts › a failed profile load renders the error screen`                                                                     | pass   | 353ms |
| `e2e/home.spec.ts › shows the hero content and desktop nav`                                                                                      | pass   | 454ms |
| `e2e/home.spec.ts › has no vertical scrollbar on common viewport sizes`                                                                          | pass   | 711ms |
| `e2e/home.spec.ts › opens and closes the mobile nav from the hamburger button`                                                                   | pass   | 566ms |
| `e2e/smoke.spec.ts › home page loads with no console errors`                                                                                     | pass   | 428ms |
| `e2e/smoke.spec.ts › the API responds`                                                                                                           | pass   | 13ms  |
| `e2e/smoke.spec.ts › a database-backed route responds`                                                                                           | pass   | 18ms  |

Playwright summary: `11 passed (4.7s)`

## Failures

None.

## Skipped

None. No spec file ran zero tests; all 3 spec files (`customer-auth.spec.ts`, `home.spec.ts`, `smoke.spec.ts`) executed fully.

E2E-RESULT: chromium 11 passed, 0 failed, 0 skipped
