---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0071
---

# TDD result — SWHR3-T-0071

## Test cases

| Case         | Test                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| SWHR3-C-0077 | lib/catalog.test.ts (requested locale; en_US fallback)                                               |
| n/a          | lib/catalog.test.ts (unknown item, no usable details), lib/errors.test.ts (CatalogItemNotFoundError) |

## Red run

`bun run test lib/catalog.test.ts lib/errors.test.ts` against a `VortexNotImplemented` stub: 3 failed, 19 passed (the two not-found tests pass under the stub because it throws).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 77 files, 464 tests passed. `bun db/seed-catalog.ts` run twice: idempotent, last line `{"itemIds":["EST-1","EST-2","EST-3","EST-4"]}`.

## Notes

`a2a_run_tests` is refused on this project (no testEvidence block), so the marker is used.

TDD-RESULT: 464 passed, 0 failed
