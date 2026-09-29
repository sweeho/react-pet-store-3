---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0145
---

# TDD result — SWHR3-T-0145

## Test cases

`lib/supplier-fulfilment.workflow.test.ts`: SWHR3-C-0217 — a placed order for EST-1 × 2 at CONFIRMED with stock 0 is approved (one PENDING PO with delivery contact and address, stage CONFIRMED); `applyInventoryUpdate` to 5 makes the PO PROCESSING, stock 3, stage ALLOCATED; `recordShipment(poId, "TRK-1")` makes the PO COMPLETED with tracking TRK-1, one invoice, `quantity_shipped` 2, stage SHIPPED and status COMPLETED.

`lib/supplier-inventory.concurrency.test.ts` (SD10): two concurrent updates to one item (1 and 5) fulfil the waiting PO exactly once, leave one reservation and a final stock of 1 or 3 depending on order; ten concurrent updates to different items are all applied; eight concurrent updates never fulfil one PO twice or drive stock negative.

`e2e/supplier-portal.spec.ts` (NOT executed, see below): SWHR3-C-0186 (supplier signs in, table shows each item and quantity, the role label), C-0188 (admin sees "Access denied" after sign-in and at `/supplier`, no rows), C-0211 (`-3` typed for an item: quantity unchanged, no "updated" marker), C-0218 (customer order for two items, admin approves with no stock, supplier sets stock and sees the banner and "updated" marker, `db/ship-supplier-po.ts` ships the PO, order appears in the admin Completed tab).

## Red run

None. This ticket proves behaviour built by earlier tickets (`allocateOrder`, `applyInventoryUpdate`, `recordShipment`, the supplier pages) and the plan says to change no production file, so the four unit tests passed on first run after one assertion fix in my own test (`recordShipment` also returns `invoiceId`, so the check became `toMatchObject`). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

The Playwright spec was NOT executed: `bun run test:e2e` stopped at its preflight because Chromium 1155 is not installed in this container; I did not retry or install a browser. What did run: the item-creation script and `db/seed-inventory.ts` used by the spec (both worked against the local db), and `bun run verify` (lint + typecheck + full unit suite), exit 0: 147 files, 1014 tests passed, which includes the two unit files above.

TDD-RESULT: 1014 passed, 0 failed
