/**
 * Client model of uncommitted order decisions (design.md C10, D8). Staged
 * state is a Map<orderId, AssignableStatus>: "uncommitted changes exist"
 * means the map is non-empty (SD7), and staging an order that is already
 * staged replaces its status rather than adding a second entry.
 */
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
  const [staged, setStaged] = useState<Map<number, AssignableStatus>>(new Map());

  const stage = useCallback((ids: number[], status: AssignableStatus) => {
    setStaged((prev) => {
      const next = new Map(prev);
      for (const id of ids) {
        next.set(id, status);
      }
      return next;
    });
  }, []);

  const unstage = useCallback((id: number) => {
    setStaged((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setStaged(new Map());
  }, []);

  const toRequest = useCallback((): OrderApprovalRequest => {
    const changes = Array.from(staged.entries())
      .sort(([a], [b]) => a - b)
      .map(([orderId, status]) => ({ orderId, status }));
    return { requestType: "UPDATESTATUS", changes };
  }, [staged]);

  return {
    staged,
    stage,
    unstage,
    clear,
    count: staged.size,
    hasUncommittedChanges: staged.size > 0,
    toRequest,
  };
}
