---
artifact: tdd-test-result
ticket: SWHR3-T-0139
---

# TDD result — SWHR3-T-0139

## Test cases

`lib/supplier-pos.test.ts` (in-memory db, orders placed through `placeOrder` with a distinct SHIP_TO):

- SWHR3-C-0197: a new PO has an integer id, `created_at` equal to the fixed `now`, status PENDING; a second order's PO gets a different id. An explicit `{ status: "PROCESSING" }` is honoured.
- SWHR3-C-0202: the PO's contact equals the SHIP_TO snapshot (Alex, Chen, alex@example.com, +1 415 555 0177); a second contact for the same PO fails.
- SWHR3-C-0203: the PO's address equals the SHIP_TO address with a null line 2.
- extra: two suppliers give two POs, each with its own contact and address.
- updated: the SWHR3-C-0174 case now expects PENDING by default, and the `markPoShipped` fixtures create their PO with `{ status: "PROCESSING" }`.

## Red run

`bun --bun vitest run lib/supplier-pos.test.ts` against the unchanged production code (default status PROCESSING, no contact copy): 5 failed | 5 passed (10), all failures on assertions.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 131 files, 902 tests passed.

TDD-RESULT: 902 passed, 0 failed
