# TDD result — SWHR3-T-0143

## Test cases

- SWHR3-C-0207: a PO short on EST-2 (needed 3, available 1) returns UNABLE with that short item, deducts nothing, stays PENDING, and writes one UNABLE attempt row whose detail names the item.
- Also: a fulfilled PO records one FULFILLED attempt; a skipped PO records none; an attempt rolls back with its transaction; log lines `supplier: PO <id> <result>` (with short items for UNABLE); `supplier: inventory <item> <before> -> <after>` per update, one summary line per call, and an unexpected failure logged with context then rethrown.

## Red run

Tests committed before any production change (fd9dd9d). `bun --bun vitest run lib/supplier-fulfilment.test.ts lib/inventory-update.test.ts`: 5 failed, 16 passed (the passing ones cover existing behaviour). `a2a_run_tests` not used: the project has no testEvidence block.

## Green run

Full gate `bun run verify` (lint + typecheck + unit): 135 files, 963 tests passed.

TDD-RESULT: 963 passed, 0 failed
