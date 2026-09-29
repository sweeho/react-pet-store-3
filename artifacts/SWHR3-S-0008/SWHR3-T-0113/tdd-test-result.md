# TDD result — SWHR3-T-0113

## Test cases

- SWHR3-C-0169: PENDING moves only to PAID. PENDING->PAID persists and writes one timestamped history row; PENDING->CONFIRMED and PAID->PENDING throw `InvalidTransitionError` and write nothing; `orders.status` stays PENDING.
- SWHR3-C-0170: all 49 stage pairs (table-driven) pass `assertStageTransition` only for the six next-stage pairs.

## Red run

Stubs throwing `VortexNotImplemented` committed first (bd359d4). `bun --bun vitest run lib/workflow-stage.test.ts`: 53 failed (53). `a2a_run_tests` was refused (no testEvidence block), so this is the local run.

## Green run

Same command after implementation passes; full gate `bun run verify` (lint + typecheck + unit): 115 files, 792 tests passed.

TDD-RESULT: 792 passed, 0 failed
