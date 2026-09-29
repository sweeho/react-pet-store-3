---
artifact: tdd-test-result
ticket: SWHR3-T-0087
---

# TDD result — SWHR3-T-0087

## Test cases

`lib/checkout.test.ts` (in-memory db, `db.transaction` spied on):

- SWHR3-C-0140: standalone call starts one transaction with `{ behavior: "immediate" }`; one order, two contacts, two lines written; cart emptied; log line carries no card data.
- SWHR3-C-0139: joins an outer transaction (`db.transaction` called once).
- SWHR3-C-0141: `insertPurchaseOrder` wrapped to run then throw; row counts unchanged and cart still holds both items.
- extra: an empty cart or undefined token throws `ShoppingCartEmptyError` and writes nothing.

## Red run

`bun --bun vitest run lib/checkout.test.ts` against a `placeOrder` stub throwing `VortexNotImplemented`: 4 failed (4).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 98 files, 624 tests passed.

TDD-RESULT: 624 passed, 0 failed
