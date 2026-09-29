---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0141
---

# TDD result — SWHR3-T-0141

## Test cases

`lib/supplier-request.test.ts`:

| Case         | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWHR3-C-0195 | `{ qty_EST-1: "12", item_EST-1: "on", qty_EST-2: "abc", …, qty_EST-3: "", item_EST-3: true, qty_EST-4: "2.5", … }` returns exactly `[{ itemId: "EST-1", quantity: 12 }]` and throws nothing                                                                                                                                                                                                                                                                                          |
| SWHR3-C-0209 | `{ qty_EST-1: "0", item_EST-1: "on" }` returns `[{ itemId: "EST-1", quantity: 0 }]`                                                                                                                                                                                                                                                                                                                                                                                                  |
| n/a          | unticked rows and ticked rows with no quantity are dropped; `true`, `"on"`, `"true"` count as ticked and `false`, `"off"`, `""`, `1`, `null` do not; invalid quantities skipped (`-3`, `2.5`, `abc`, empty, blank, `1e3`, `0x10`, `+4`, non-ASCII digits, an unsafe integer); quantity trimmed; JSON whole numbers accepted, negative or fractional ones not; ticked-row order and punctuated item ids kept; empty item id and unrelated fields ignored; non-object bodies give `[]` |

## Red run

`bun run test lib/supplier-request.test.ts` against a `VortexNotImplemented` stub: 32 failed (the two constants test aside). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 134 files, 950 tests passed. `bun run build` exit 0.

TDD-RESULT: 950 passed, 0 failed
