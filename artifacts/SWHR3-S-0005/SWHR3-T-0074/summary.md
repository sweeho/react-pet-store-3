---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0074
---

# Summary — SWHR3-T-0074

Added `e2e/cart.spec.ts`: six Playwright tests against the seeded catalogue (`beforeAll` spawns `bun db/seed-catalog.ts` with a SQLITE_BUSY retry, as `e2e/order-approval.spec.ts` does). Each test has its own browser context, so its own `petstore_cart`; items are added through `page.request` since no catalogue UI exists. Covers the full journey (empty message, two rows with line totals and subtotal, update, Remove, Check Out to `/checkout`), persistence across navigation, negative and non-numeric quantities removing the row, emptying via `DELETE /api/cart`, and `/checkout` blocked when empty.

Files: `e2e/cart.spec.ts` only. No production code changed.

AC coverage: AC-1 by `[SWHR3-C-0090]`, plus the other five cases.

Verification: `bun run verify` exit 0 (561 tests). `bun run test:e2e` could not run: Chromium is not installed in this container (preflight failure), so the spec was not executed locally; CI runs it.
