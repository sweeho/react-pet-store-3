---
artifact: integration-defects-resolution
spec: 1
status: draft
author_role: validation
sprint: SWHR3-S-0009
idea: SWHR3-I-0007
branch: vortex/sprint/swhr3-s-0009-cffad66f
---

# Integration defects resolution — SWHR3-S-0009

## DEFECT-1: migration 0007 fails on a database that already holds supplier purchase orders

- Scenario violated: none. SPEC-GAP: upgrading an existing database through migration 0007 — no scenario covers this behaviour.
- Reproduction: `sqlite.db` left by the previous sprint's E2E run (migrations 0000-0006 applied, 1 row in `supplier_purchase_orders`, 2 `line_items` rows referencing it). `bun run test:e2e` fails with `Timed out waiting 120000ms from config.webServer`; the server log shows `DrizzleError: Failed to run the query 'DROP TABLE `supplier_purchase_orders`;'` caused by `SQLiteError: FOREIGN KEY constraint failed` at db/client.ts `migrate()`.
- Root cause: drizzle's migrator runs each migration inside a transaction, where SQLite ignores `PRAGMA foreign_keys=OFF`. `db/client.ts` opens every connection with `foreign_keys = ON`, so the table rebuild in `drizzle/0007_condemned_pyro.sql` drops a parent table that child rows still reference. Empty databases and the in-memory Vitest database never hit it, which is why 1014 unit tests pass.

### Round 1
