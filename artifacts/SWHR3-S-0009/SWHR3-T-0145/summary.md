---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0145
---

# Summary — SWHR3-T-0145

- `lib/supplier-fulfilment.workflow.test.ts`: the full chain in one test (approval → PENDING PO with contact and address → supplier stock update → PROCESSING and ALLOCATED → shipment → invoice, `quantity_shipped`, order SHIPPED and COMPLETED).
- `lib/supplier-inventory.concurrency.test.ts`: concurrent `applyInventoryUpdate` calls serialise: a waiting PO is fulfilled once, stock never goes negative, parallel updates to different items are all applied.
- `e2e/supplier-portal.spec.ts`: four Playwright journeys: supplier sign-in and inventory table, administrator denied, `-3` ignored, and a waiting order fulfilled by a supplier update, shipped and completed. Each test creates its own catalogue items (unique ids, via a `bun -e` insert) and seeds only those, so the shared `EST-*` stock that other specs set cannot change what it sees.

Files: those three, plus nothing else. No production code changed.

Caveats: the e2e spec was not run here (Chromium 1155 is missing, so `bun run test:e2e` stops at its preflight); selectors were checked by reading the supplier pages, and the item-creation and seed scripts were run for real. Every supplier update reprocesses all PENDING POs system-wide, and `e2e/order-workflow.spec.ts` seeds stock for all items, so a very unlucky interleaving could give another test's PO stock; this spec's own items are unaffected. First real run is Validation/CI, and any failure there should be treated as a spec defect first. `e2e/order-workflow.spec.ts` was not changed.

Design: the ticket builds no UI; the spec asserts the supplier sign-in, inventory, after-update and access-denied mockups' main content and shell.

AC coverage: AC-1 by `[SWHR3-C-0217]` (unit) and `[SWHR3-C-0218]` (e2e, unexecuted), with `[SWHR3-C-0186]`, `[SWHR3-C-0188]` and `[SWHR3-C-0211]` for the portal.

Verification: `bun run verify` exit 0 (1014 tests). `bun run test:e2e` could not run (no Chromium).
