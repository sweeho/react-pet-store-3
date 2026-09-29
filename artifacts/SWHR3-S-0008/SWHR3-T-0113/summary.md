# SWHR3-T-0113 summary

Added `lib/workflow-stage.ts` per C3/D1: `WORKFLOW_STAGES`, `WorkflowStage`, `nextStage`, `assertStageTransition` (legal only to the next stage, reusing `InvalidTransitionError`) and `setWorkflowStage(tx, orderId, to)`, which re-reads the stage in `tx`, asserts, updates `workflow_stage` and appends an `order_stage_history` row with `changedAt`. `orders.status` is never touched. An unknown order throws `NotFoundError`.

Files: `lib/workflow-stage.ts`, `lib/workflow-stage.test.ts`.

AC coverage: "transition order status to PAID" -> SWHR3-C-0169, SWHR3-C-0170.

Verification: `bun run verify` exit 0 (792 tests passed). `a2a_run_tests` refused (no testEvidence), marker used.
