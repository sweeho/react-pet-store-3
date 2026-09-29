# TDD result — SWHR3-T-0128

## Test cases

- SWHR3-C-0224: `/api/supplier/inventory` answers 401 with no session, 403 FORBIDDEN for a customer and an admin, passes for a supplier; a supplier gets 403 on `/api/admin/orders`. (Middleware level: the inventory route itself belongs to a later ticket.)
- SWHR3-C-0225: a supplier role changed to customer in the database is refused on the next request with the same cookie.
- Also: `getAccountRole` returns `supplier`; `SUPPLIER_API_PREFIX` / `isSupplierApiPath` matching.

## Red run

Tests committed before any production change (e2378b5). `bun --bun vitest run lib/roles.test.ts lib/protected-resources.test.ts middleware/auth.test.ts`: 8 failed, 24 passed (the passing ones cover existing behaviour). `a2a_run_tests` not used: the project has no testEvidence block.

## Green run

Full gate `bun run verify` (lint + typecheck + unit): 125 files, 864 tests passed.

TDD-RESULT: 864 passed, 0 failed
