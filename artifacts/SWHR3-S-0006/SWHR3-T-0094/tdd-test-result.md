---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0094
---

# TDD result — SWHR3-T-0094

## Test cases

| Case         | Test                                                                                                                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0126 | `lib/order-confirmation.test.ts`: email is the billing email though shipping has another; `routes/api/orders/[id].get.test.ts`: route answers the billing email; `src/pages/orders/[id].test.tsx`: page shows "Notifications sent to" and the email |
| SWHR3-C-0138 | `lib/order-confirmation.test.ts`: billing and shipping read back with all ten fields, billing `address2` null                                                                                                                                       |
| n/a          | lib: id, date, masked card, lines and total, no full card number, NotFoundError for another account or missing order, catalogue-missing item falls back to its id                                                                                   |
| n/a          | route: 404 for another account's order, unknown id, `abc`, `1.5`; 401 signed out                                                                                                                                                                    |
| n/a          | page: lines and totals, both addresses, "Java Card ending 4412 · Expires 03/2029", Continue shopping link, 401 goes to /signin, 404 and non-numeric id show the not-found alert                                                                     |

## Red run

`bun run test` over `lib/order-confirmation.test.ts` and `src/pages/orders` against `VortexNotImplemented` stubs: 12 failed. The route test (`routes/api/orders/[id].get.test.ts`) was not included in that run's path filter, so its red was NOT observed; it was first run after the implementation and passed. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 106 files, 660 tests passed. `bun run build` exit 0. No browser run of the page (no Chromium here, and no E2E in this ticket's scope).

TDD-RESULT: 660 passed, 0 failed
