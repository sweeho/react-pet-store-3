---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0075
---

# TDD result — SWHR3-T-0075

## Test cases

| Case         | Test (routes/api/cart/errors.test.ts)                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR3-C-0096 | non-numeric quantity removes that item only                                                                                                                                                                          |
| SWHR3-C-0071 | GET omits a line whose catalogue item was deleted                                                                                                                                                                    |
| n/a          | PUT "abc" / "2.5" / "" removes the item; POST without itemId 422; DELETE blank id 422; POST unknown item 404; GET no cookie empty with no Set-Cookie; malformed cookie reads empty; 20 concurrent adds leave one row |

## Red run

No red run exists. This ticket is a hardening suite over routes and `lib/` code built by T-0069/T-0070, and every case already passed on its first run, so no defect was found and no production code changed. Only one failure occurred, in my own DELETE test (it used `.rejects` on a synchronous handler); I fixed the test, not the code. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 86 files, 534 tests passed (11 new).

TDD-RESULT: 534 passed, 0 failed
