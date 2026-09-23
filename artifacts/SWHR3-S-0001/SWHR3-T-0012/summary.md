---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0012
branch: vortex/feat/SWHR3-T-0012-6-customer-address-card-and-preference-s-fad40607
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0012/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0012: Customer, address, card and preference storage

## What changed

Added the `customers` and `creditCards` tables (design.md D8/C13) with their generated migration: `customers` holds the full create-customer form (contact, address, preferences) 1:1 with `accounts`; `creditCards` holds card data 1:1 with `customers`, `ON DELETE CASCADE`. Enabled SQLite foreign-key enforcement so the cascade actually fires.

## Files

- `db/schema.ts` — new `customers` and `creditCards` tables per D8/C13.
- `db/client.ts` — registers both tables in the schema map; adds `sqlite.exec("PRAGMA foreign_keys = ON")` so `creditCards`' cascade delete is enforced (bun:sqlite doesn't enable FK enforcement by default).
- `drizzle/0002_breezy_ultimo.sql` + `drizzle/meta/{0002_snapshot.json,_journal.json}` — generated migration (`bun run db:generate`).
- `lib/customer-storage.test.ts` — direct storage-layer tests against the real (in-memory, `VITEST=true`) db; no service module in this ticket's scope.

## AC coverage

- AC-1 (customer profile persists and reads back) — `lib/customer-storage.test.ts › persists every customer and card column and reads it back unchanged`.
- AC-2 (interface contract: exact `customers`/`creditCards` columns, migration committed) — schema matches the AC's column list field-for-field; migration committed under `drizzle/`; `› defaults locale to en_US…` and `› rejects a duplicate email…` cover the default and the email uniqueness named in the contract.
- AC-3 (cascade delete + duplicate-account rejection) — `› deletes the card row when its customer row is deleted` and `› rejects a second customer row for the same account`.
- AC-4 (`users` table/seed/routes unchanged) — `db/client.ts`'s `users` seed block is untouched; the existing `routes/api/users/*.test.ts` files (unmodified) still pass in the full run below.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/customer-storage.test.ts
Test Files  1 passed (1)
     Tests  5 passed (5)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  23 passed (23)
     Tests  144 passed (144)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 144 passed, 0 failed`. The red run reverted `db/schema.ts`/`db/client.ts` (`git stash`) to prove the new test genuinely failed against the pre-ticket schema, then restored them.

## Notes

No design reference applies beyond context: `mockup-create-customer.html` (linked in `PLAN.md`) is the form this schema exists to store, but no route or page is wired up in this ticket — storage only.
