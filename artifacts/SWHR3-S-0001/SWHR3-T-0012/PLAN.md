# PLAN — SWHR3-T-0012: Customer, address, card and preference storage

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 6. Customer Profile Storage (every checkbox in it is tagged `(SWHR3-T-0012)`)
- **Requirements:** Customer profile creation and persistence (created)
- **Depends on:** SWHR3-T-0018 (transitively SWHR3-T-0017, which adds `accounts` to the same files)

## Objective

Add the customers and creditCards tables of design.md D8 with a generated, committed migration, so profile rows persist every field of the create-customer form.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-create-customer.html` (the fields that must be storable)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. In `db/schema.ts`, add `customers` and `creditCards` per D8 / C13, with foreign keys to `accounts.id` and `customers.id` (`onDelete: "cascade"` for the card) and unique indexes on `customers.accountId`, `customers.email` and `creditCards.customerId`. Booleans use `integer({ mode: "boolean" })` and timestamps `integer({ mode: "timestamp" })`, matching the `accounts` table from SWHR3-T-0017.
1. Register both tables in the schema map in `db/client.ts`. Leave the `users` seed untouched.
1. Generate the migration with the project's `db-generate` command and commit the new `drizzle/000N_*.sql` plus `drizzle/meta/*`. Enable SQLite foreign keys (`PRAGMA foreign_keys = ON`) in `db/client.ts` if the cascade needs it.
1. Tests: `lib/customer-storage.test.ts` (server project; in-memory db) creates an account, inserts a customer and card with every column, reads them back unchanged, checks that deleting the customer removes the card, and checks that a second customer for the same account is rejected. The existing `routes/api/users/*` tests stay green.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `db/schema.ts` (customers, creditCards)
- `db/client.ts` (schema map, foreign-keys pragma)
- `drizzle/` (new migration + meta)
- `lib/customer-storage.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
