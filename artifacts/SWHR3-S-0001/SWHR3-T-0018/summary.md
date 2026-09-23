---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0018
branch: vortex/feat/SWHR3-T-0018-12-transaction-helper-for-multi-step-wri-998086f3
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0018/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0018: Transaction helper for multi-step writes

## What changed

Added `lib/transaction.ts` (design.md D12, interface contract C7): `DbOrTx` — the union of the `db` instance type and the Drizzle bun-sqlite transaction type — and `withTransaction<T>(fn, outer?)`, which joins `outer` when given (no commit of its own) or otherwise runs `db.transaction(fn)`, committing on return and rolling back on throw. Synchronous throughout, matching bun-sqlite's synchronous transaction API.

## Files

- `lib/transaction.ts` — `DbOrTx` type and `withTransaction`.
- `lib/transaction.test.ts` — standalone commit, standalone rollback-on-throw, joining an outer transaction, and outer rollback removing a joined inner write; all against the real in-memory db (VITEST=true, `db/client.ts`) and the `accounts` table from SWHR3-T-0017.

## AC coverage

- AC-1 (standalone call auto-creates and commits a transaction) — `lib/transaction.test.ts › commits a standalone write, making it visible afterwards`.
- AC-2 (a call given an existing transaction participates in it rather than starting a new one) — `lib/transaction.test.ts › joins an outer transaction instead of starting a second one`.
- AC-3 (interface contract: `lib/transaction.ts` exports `DbOrTx` and `withTransaction<T>(fn, outer?): T`) — see Files; verified by `tsc --build` (`bun run typecheck`) typing the tests against the real export signatures.
- AC-4 (`fn` throws → no write inside it is visible afterwards) — `lib/transaction.test.ts › rolls back a standalone write when fn throws, leaving no row`.
- AC-5 (`withTransaction` given an outer transaction runs `fn` inside it without its own commit; rolling back the outer transaction removes the inner writes) — `lib/transaction.test.ts › rolling back the outer transaction removes writes made by a joined inner call`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/transaction.test.ts
Test Files  1 passed (1)
     Tests  4 passed (4)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  22 passed (22)
     Tests  139 passed (139)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 139 passed, 0 failed`. Red phase confirmed separately by stubbing `withTransaction` to throw before restoring the real implementation (see `tdd-test-result.md` "Red run").

## Notes

- No design reference applies: this ticket is a pure backend helper (PLAN.md "Design reference: n/a") with no route wiring or UI, consumed by later customer/account tickets that need multi-row writes (e.g. a customer plus its card).
- Confirmed via `tsc --build` under strict mode that `(tx: DbOrTx) => T` is assignable where `db.transaction` expects `(tx: Tx) => T` (parameter contravariance, since `Tx` is a member of the `DbOrTx` union) — no `any`/type assertion needed.
