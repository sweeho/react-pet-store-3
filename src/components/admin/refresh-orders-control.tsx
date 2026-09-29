/**
 * The queue's Refresh button, guarding against silently discarding
 * uncommitted decisions (design.md D8/D11, SD7, C12). Refresh reloads
 * immediately when nothing is staged; with staged decisions it opens a
 * "Discard N uncommitted changes?" dialog first. Layout follows the
 * mockup (artifacts/SWHR3-S-0003/design/mockup-uncommitted-changes-
 * warning-on-refresh.html); its exact copy is overridden by D11, which
 * this component quotes verbatim.
 */
import { ArrowRight } from "lucide-react";

import {
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogTitle,
} from "@/components/ui";
import type { AssignableStatus } from "@/constants/order-status";

export interface RefreshOrdersControlProps {
  staged: ReadonlyMap<number, AssignableStatus>;
  onRefresh: () => void;
  onDiscard: () => void;
}

export function RefreshOrdersControl({ staged, onRefresh, onDiscard }: RefreshOrdersControlProps) {
  const [open, setOpen] = useState(false);
  const count = staged.size;

  function handleRefreshClick() {
    if (count === 0) {
      onRefresh();
      return;
    }
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    onDiscard();
    onRefresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={handleRefreshClick}>
        Refresh
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogPanel>
          <DialogTitle>Discard {count} uncommitted changes?</DialogTitle>
          <DialogDescription>
            Refreshing reloads every order from the server and replaces what is on screen.
          </DialogDescription>
          <ul className="border-border mt-4 divide-y rounded-md border">
            {Array.from(staged.entries()).map(([orderId, status]) => (
              <li key={orderId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="font-semibold">{orderId}</span>
                <ArrowRight
                  className="text-muted-foreground ml-auto h-3.5 w-3.5"
                  aria-hidden="true"
                />
                <span className="font-semibold">{status}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel — keep my changes
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleConfirm}>
              Refresh anyway
            </Button>
          </DialogFooter>
        </DialogPanel>
      </Dialog>
    </>
  );
}
