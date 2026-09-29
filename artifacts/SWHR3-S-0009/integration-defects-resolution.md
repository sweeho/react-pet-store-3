---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0009
idea: SWHR3-I-0007
branch: vortex/sprint/swhr3-s-0009-cffad66f
upstream: [artifacts/SWHR3-S-0009/integration-test-result.md]
downstream: [artifacts/SWHR3-S-0009/qa-test-report.md]
---

# Integration defects resolution — SWHR3-S-0009

## DEFECT-1: migration 0007 fails on a database that already holds supplier purchase orders

- Scenario violated: none. SPEC-GAP: upgrading an existing database through migration 0007 — no scenario covers this behaviour.
- Reproduction: `sqlite.db` left by the previous sprint's E2E run (migrations 0000-0006 applied, 1 row in `supplier_purchase_orders`, 2 `line_items` rows referencing it). `bun run test:e2e` fails with `Timed out waiting 120000ms from config.webServer`; the server log shows `DrizzleError: Failed to run the query 'DROP TABLE supplier_purchase_orders;'` caused by `SQLiteError: FOREIGN KEY constraint failed`, raised from `migrate()` in `db/client.ts`.
- Root cause: drizzle's migrator runs each migration inside a transaction, where SQLite ignores `PRAGMA foreign_keys=OFF`. `db/client.ts` opens every connection with `foreign_keys = ON`, so the table rebuild in `drizzle/0007_condemned_pyro.sql` drops a parent table that child rows still reference. Empty databases and the in-memory Vitest database never hit it, which is why the unit suite was green.

### Round 1

Fix in `db/client.ts`: `PRAGMA foreign_keys = OFF` before `migrate()`, then `PRAGMA foreign_key_check` (throws if any violation is left), then `PRAGMA foreign_keys = ON`. Validation: the copy of the stale database migrated and the full E2E passed on it (`39 passed (16.1s)`); a fresh database also passed (`39 passed (15.7s)`); `bun run verify` exit 0, 1014/1014 tests. Status: FIXED-IN-PLACE. No regression test was added for the upgrade path (the Vitest database is in-memory and always starts empty); recorded as a follow-up gap, not filed.

## DEFECT-2: supplier-portal E2E asserts `columnheader` roles that Playwright 1.50.1 does not report

- Scenario violated: Inventory display screen / Inventory items are displayed to authorized users, as exercised by [SWHR3-C-0186].
- Reproduction: `e2e/supplier-portal.spec.ts:152` `getByRole("columnheader", { name: "Item ID" })` timed out with `<element(s) not found>` on a fresh database and on the stale one, in the full run and in the spec alone. A scratch spec on `<table><thead><tr><th>Item ID</th>` gave `columnheader` count 0 and `cell` count 1 under the pinned `@playwright/test` 1.50.1.
- Root cause: Playwright 1.50's role engine reports a plain `<th>` as `cell`. The page markup is correct (`src/components/supplier/inventory-table.tsx` renders `<th>Item ID</th>` and its unit test asserts `columnheader`). The defect is the E2E assertion.

### Round 1

Fix in `e2e/supplier-portal.spec.ts` lines 152-153: `page.locator("th", { hasText: ... })` in place of the two `getByRole("columnheader")` calls. Validation: [SWHR3-C-0186] passed in the full run `39 passed (15.7s)`. Status: FIXED-IN-PLACE.

## Summary

| Defect   | Title                                                                  | Rounds | Resolution                                     |
| -------- | ---------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| DEFECT-1 | Migration 0007 fails on a database with existing supplier POs          | 1      | FIXED-IN-PLACE (`db/client.ts`)                |
| DEFECT-2 | E2E asserts `columnheader` role that Playwright 1.50.1 does not report | 1      | FIXED-IN-PLACE (`e2e/supplier-portal.spec.ts`) |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
