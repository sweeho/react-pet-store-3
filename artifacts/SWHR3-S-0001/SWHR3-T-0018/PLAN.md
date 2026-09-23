# PLAN — SWHR3-T-0018: Transaction helper for multi-step writes

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 12. Transaction Management (every checkbox in it is tagged `(SWHR3-T-0018)`)
- **Requirements:** Transaction semantics for customer operations
- **Depends on:** SWHR3-T-0017 (db + accounts table to exercise)

## Objective

One helper that gives multi-row writes all-or-nothing behaviour and lets a caller already inside a transaction extend it rather than start a second one.

## Design reference

- n/a (no screen)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/transaction.ts` (C7). `DbOrTx` is the union of the `db` instance type and the Drizzle bun-sqlite transaction type. `withTransaction(fn, outer?)` returns `fn(outer)` when `outer` is given (joins it, no commit of its own) and otherwise `db.transaction(fn)`, which commits on return and rolls back on throw. Keep it synchronous; bun-sqlite transactions are synchronous.
1. Tests: `lib/transaction.test.ts` (in-memory db; use the `accounts` table from SWHR3-T-0017):
   - a committed write is visible afterwards;
   - a throw inside `fn` leaves no row;
   - a nested call with `outer` followed by an outer throw leaves no inner row;
   - a nested call whose outer transaction commits keeps both rows.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/transaction.ts`
- `lib/transaction.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
