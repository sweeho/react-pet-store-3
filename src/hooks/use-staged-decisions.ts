import type { AssignableStatus } from "@/constants/order-status";
import type { OrderApprovalRequest } from "@/types/order-approval";

export interface UseStagedDecisionsResult {
  staged: ReadonlyMap<number, AssignableStatus>;
  stage(ids: number[], status: AssignableStatus): void;
  unstage(id: number): void;
  clear(): void;
  count: number;
  hasUncommittedChanges: boolean;
  toRequest(): OrderApprovalRequest;
}

export function useStagedDecisions(): UseStagedDecisionsResult {
  throw new Error("VortexNotImplemented");
}
