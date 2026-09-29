---
artifact: tdd-test-result
ticket: SWHR3-T-0134
---

# TDD result — SWHR3-T-0134

## Test cases

`routes/api/supplier/inventory.post.test.ts` (real `H3Event` through `middleware/auth.ts`, supplier session):

- SWHR3-C-0191: `{ "qty_EST-2": "5", "item_EST-2": "on" }` for an approved order waiting on EST-2 (stock 0, PENDING PO of 2): 200, `updated ["EST-2"]`, `fulfilledOrders 1`, stock 3, PO PROCESSING.
- two ticked valid rows and one unticked row update exactly two items (a `true` checkbox counts as ticked).
- SWHR3-C-0196: `qty "abc"` ticked: 200, `updated []`, no error body, stock still 40.
- SWHR3-C-0210: `qty "-3"` skipped and `EST-1` 9 applied: `updated ["EST-1"]`, EST-2 still 40.
- a form-encoded body gets 415; a customer gets 403 and a signed-out caller 401, with stock unchanged.

`lib/supplier-portal.modules.test.ts`: SWHR3-C-0226, the five portal modules load by static import and export their C3–C9 functions.

## Red run

`bun --bun vitest run routes/api/supplier/inventory.post.test.ts lib/supplier-portal.modules.test.ts` with the route stubbed to throw `VortexNotImplemented`: 5 failed | 2 passed (7). The 2 that passed are the 401/403 test (the middleware rejects before the handler) and the modules test (SD8 proof of modules that already exist).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 137 files, 964 tests passed.

TDD-RESULT: 964 passed, 0 failed
