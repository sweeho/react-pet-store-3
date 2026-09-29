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

export function assertStageTransition(): void {
  throw new Error("VortexNotImplemented");
}

export function setWorkflowStage(): void {
  throw new Error("VortexNotImplemented");
}
