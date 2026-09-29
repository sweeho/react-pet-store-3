/**
 * Confirms, sends and reports the result of committing every staged
 * decision (design.md D11, C11), following the three commit mockups
 * (artifacts/SWHR3-S-0003/design/mockup-commit-staged-decisions-
 * confirmation.html, -success.html, -failure-all-roll.html). `request` is
 * the caller's already-built OrderApprovalRequest (useStagedDecisions'
 * toRequest(), SWHR3-T-0038) — this component owns no staged state itself,
 * so a failure "keeps every staged decision" simply by never calling
 * onCommitted, the only signal that tells a caller it is safe to clear.
 */
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogTitle,
} from "@/components/ui";
import type { OrderApprovalRequest } from "@/types/order-approval";
import { commitOrderDecisions } from "@/utils/admin-orders-api";
import { ApiError } from "@/utils/api";

export interface CommitDecisionsDialogProps {
  open: boolean;
  request: OrderApprovalRequest;
  onClose: () => void;
  onCommitted: (updated: number) => void;
}

type Phase = "confirm" | "committing" | "success" | "error";

function decisionWord(count: number): string {
  return count === 1 ? "decision" : "decisions";
}

function joinOrderIds(orderIds: number[]): string {
  if (orderIds.length <= 1) {
    return orderIds.join("");
  }
  return `${orderIds.slice(0, -1).join(", ")} and ${orderIds[orderIds.length - 1]}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // AC-5: the dialog always shows this exact message for a 403, even if
    // the server ever worded it differently.
    return error.status === 403 ? "Administrator credentials required" : error.message;
  }
  return "Something went wrong. Try again.";
}

export function CommitDecisionsDialog({
  open,
  request,
  onClose,
  onCommitted,
}: CommitDecisionsDialogProps) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(0);

  // Reset to the confirmation view whenever the dialog (re-)opens, without
  // the cascading-render effect anti-pattern: adjusting state during
  // render, guarded by comparing against the previous `open` value, is
  // React's documented alternative to setState-in-an-effect (same
  // technique src/hooks/use-session.ts uses for its `loading` derivation).
  const [priorOpen, setPriorOpen] = useState(open);
  if (open !== priorOpen) {
    setPriorOpen(open);
    if (open) {
      setPhase("confirm");
      setMessage("");
    }
  }

  const count = request.changes.length;

  function handleClose() {
    if (phase !== "committing") {
      onClose();
    }
  }

  async function handleCommit() {
    setPhase("committing");
    try {
      const response = await commitOrderDecisions(request);
      setUpdated(response.updated);
      setPhase("success");
      onCommitted(response.updated);
    } catch (error) {
      setMessage(errorMessage(error));
      setPhase("error");
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogPanel>
        {(phase === "confirm" || phase === "committing") && (
          <>
            <DialogTitle>
              Commit {count} {decisionWord(count)}?
            </DialogTitle>
            <DialogDescription>
              These orders are sent to the server in a single update.
            </DialogDescription>
            <ul className="border-border mt-4 divide-y rounded-md border">
              {request.changes.map((change) => (
                <li key={change.orderId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="font-semibold">{change.orderId}</span>
                  <span className="text-muted-foreground ml-auto flex items-center gap-2">
                    PENDING
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-foreground font-semibold">{change.status}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 text-xs">
              All {count} are saved together. If one of them fails, none of the decisions are saved.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={phase === "committing"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCommit}
                disabled={phase === "committing"}
              >
                {phase === "committing" ? "Committing…" : `Commit ${count} ${decisionWord(count)}`}
              </Button>
            </DialogFooter>
          </>
        )}
        {phase === "success" && (
          <>
            <DialogTitle>
              <CheckCircle2
                className="mr-2 inline h-5 w-5 align-text-bottom text-teal-600"
                aria-hidden="true"
              />
              {updated} {decisionWord(updated)} committed
            </DialogTitle>
            <DialogDescription>
              Orders {joinOrderIds(request.changes.map((change) => change.orderId))} now hold their
              new status on the server.
            </DialogDescription>
            <DialogFooter>
              <Button type="button" size="sm" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
        {phase === "error" && (
          <>
            <DialogTitle>Nothing was saved</DialogTitle>
            <DialogDescription>
              The batch was rejected, so all {count} {decisionWord(count)} were rolled back.
            </DialogDescription>
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle aria-hidden="true" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground mt-4 text-xs">
              Your staged decisions are still in the queue. Refresh to see the current status of
              every order, then decide again.
            </p>
            <DialogFooter>
              <Button type="button" size="sm" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPanel>
    </Dialog>
  );
}
