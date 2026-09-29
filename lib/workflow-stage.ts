/**
 * The order workflow stages and their one-step-forward rule (design.md D1,
 * C3). Separate from orders.status, which stays the approval status.
 */
import { eq } from "drizzle-orm";

import { orderStageHistory, orders } from "../db/schema";
import { InvalidTransitionError, NotFoundError } from "./errors";
import type { DbOrTx } from "./transaction";

export const WORKFLOW_STAGES = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "ALLOCATED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

/** The stage after `stage`, or null for the last one. */
export function nextStage(stage: WorkflowStage): WorkflowStage | null {
  return WORKFLOW_STAGES[WORKFLOW_STAGES.indexOf(stage) + 1] ?? null;
}

/** Legal only to the next stage; every other pair, including a no-op, throws. */
export function assertStageTransition(
  orderId: number,
  from: WorkflowStage,
  to: WorkflowStage,
): void {
  if (nextStage(from) !== to) {
    throw new InvalidTransitionError(orderId, from);
  }
}

/**
 * Re-reads the stage inside `tx`, asserts the transition, updates
 * workflow_stage and appends the timestamped history row.
 */
export function setWorkflowStage(tx: DbOrTx, orderId: number, to: WorkflowStage): void {
  const row = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!row) {
    throw new NotFoundError(`Order ${orderId} not found`);
  }

  // schema.ts stores workflow_stage as plain text.
  assertStageTransition(orderId, row.workflowStage as WorkflowStage, to);

  const now = new Date();
  tx.update(orders).set({ workflowStage: to, updatedAt: now }).where(eq(orders.id, orderId)).run();
  tx.insert(orderStageHistory).values({ orderId, stage: to, changedAt: now }).run();
}
