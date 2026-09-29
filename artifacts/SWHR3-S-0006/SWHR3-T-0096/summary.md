---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0096
---

# Summary — SWHR3-T-0096

Added `e2e/checkout.spec.ts`: four Playwright tests. `beforeAll` seeds the catalogue with `bun db/seed-catalog.ts` (SQLITE_BUSY retry, as `e2e/cart.spec.ts`). Each test registers a customer, creates a profile through `/api/customers` (so billing is pre-filled), and fills the cart through `page.request`. Journeys: signed-out visit redirects to sign-in `[SWHR3-C-0145]`; signed-in checkout to the confirmation and an empty cart afterwards `[SWHR3-C-0144]`; blank billing city shows the summary and stays on `/checkout`; cart emptied mid-checkout shows the empty-cart state `[SWHR3-C-0118]`.

Files: `e2e/checkout.spec.ts` only. No production code changed.

Design: the ticket builds no UI; the spec asserts what the checkout, missing-fields, empty-cart and confirmation mockups show (main content, SD12).

AC coverage: AC-1 by `[SWHR3-C-0118]`, with `[SWHR3-C-0144]` and `[SWHR3-C-0145]` covering the main journey and the sign-in guard.

Verification: `bun run verify` exit 0 (704 tests). `bun run test:e2e` could NOT run: Chromium 1155 is not installed in this container (preflight failure), so the spec has never been executed; treat any failure in Validation or CI as a defect in this spec first (selectors were checked by reading the page components, not by running them).
