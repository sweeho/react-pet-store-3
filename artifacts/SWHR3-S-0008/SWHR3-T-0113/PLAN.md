---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
ticket: SWHR3-T-0113
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [openspec/changes/swhr3-i-0006-order-processing-and-fulfil/design.md]
downstream: [artifacts/SWHR3-S-0008/SWHR3-T-0113/tdd-test-result.md]
---

# Plan — SWHR3-T-0113: Order Status Management — workflow stages, transition rule and stage history

Change: `swhr3-i-0006-order-processing-and-fulfil`, tasks.md group 5. Requirement(s): "Order status lifecycle". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0008)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0120.

## Objective

The workflow-stage vocabulary, its one-step-forward rule, and a writer that records each change with a timestamp exist per C3.

## Steps

1. Create `lib/workflow-stage.ts` per C3 and D1. A transition is legal only to `nextStage(from)`. `setWorkflowStage` re-reads the stage inside `tx`, asserts the transition (`InvalidTransitionError` from `lib/errors.ts`, reused), updates `workflow_stage` and appends `order_stage_history` with `changedAt` = now.
2. Test in `lib/workflow-stage.test.ts`: all 49 pairs, table-driven, are legal only for the next stage; PENDING→PAID persists and writes one history row with a timestamp; PENDING→CONFIRMED and PAID→PENDING throw and write nothing; `orders.status` is never touched.

## File/module ownership

- `lib/workflow-stage.ts, lib/workflow-stage.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees, and the idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 5 checkboxes tagged with this key are stamped when it merges.
