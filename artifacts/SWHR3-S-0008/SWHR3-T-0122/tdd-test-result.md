---
artifact: tdd-test-result
ticket: SWHR3-T-0122
---

# TDD result — SWHR3-T-0122

## Test cases

- `lib/order-processing.concurrency.test.ts`: SWHR3-C-0184. Ten `processOrder` calls via `Promise.all`, one account each: ten distinct orders, each with its own `account_id` and billing email, exactly one payment row and one outbox row.
- `e2e/order-workflow.spec.ts` (Playwright): SWHR3-C-0157 (browser order lands on `/orders/<id>` showing the number), C-0168 (card 4000 0000 0000 0002 shows the declined alert, stays on `/checkout`, `/cart` still lists both items), C-0181 (place order, `db/seed-inventory.ts --all 10`, admin approves on `/admin/orders`, `db/ship-supplier-po.ts` for the order's PO, order appears in the Completed tab).

## Red run

Not applicable. These tests prove behaviour that already exists (plan: no production change), so no stub was possible. The concurrency test passed on its first run: 1 passed (1).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 125 files, 855 tests passed.

The E2E spec was NOT executed: `bun run test:e2e` stopped in its preflight because Playwright's Chromium is not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome`). It is type-checked and linted by `verify`, and its `bun -e` PO lookup was checked by hand; its browser steps have not been run. It runs in CI and in the QA phase.

TDD-RESULT: 855 passed, 0 failed
