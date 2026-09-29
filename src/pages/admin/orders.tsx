/**
 * /admin/orders (design.md D10/D11): the four-tab order queue. Only
 * Pending is editable — OrdersTable (SWHR3-T-0037) owns its own row
 * selection/Approve/Deny toolbar; this page owns staging
 * (useStagedDecisions, SWHR3-T-0038), sorting (sortOrders,
 * SWHR3-T-0041) and the commit flow (CommitDecisionsDialog,
 * SWHR3-T-0043). The wireframe's four top-level tabs replace the hi-fi
 * mockup's two-tab "Pending / Decided" layout (D10, SD14). Refresh goes
 * through RefreshOrdersControl (SWHR3-T-0042), which warns before
 * discarding staged decisions.
 */
import { AdminShell } from "@/components/admin/admin-shell";
import { CommitDecisionsDialog } from "@/components/admin/commit-decisions-dialog";
import { OrdersTable } from "@/components/admin/orders-table";
import type { OrdersTableSort } from "@/components/admin/orders-table";
import { RefreshOrdersControl } from "@/components/admin/refresh-orders-control";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui";
import { ORDER_STATUSES } from "@/constants/order-status";
import type { OrderStatus } from "@/constants/order-status";
import { useStagedDecisions } from "@/hooks/use-staged-decisions";
import type { OrdersByStatus } from "@/types/order-approval";
import { ApiError } from "@/utils/api";
import { fetchOrdersByStatus } from "@/utils/admin-orders-api";
import { cn } from "@/utils";
import { sortOrders } from "@/utils/sort-orders";

const TAB_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DENIED: "Denied",
  COMPLETED: "Completed",
};

const READ_ONLY_NOTE = "Read-only — a decision cannot be changed once committed.";

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrdersByStatus | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<OrdersTableSort>({ column: "id", direction: "asc" });
  const [commitOpen, setCommitOpen] = useState(false);
  const staging = useStagedDecisions();

  const load = useCallback(() => {
    return fetchOrdersByStatus()
      .then((result) => setOrders(result))
      .catch((error: unknown) => {
        // A signed-out or non-admin visitor's effect races RequireAdmin's
        // own session check below; a 401/403 here means that gate is about
        // to redirect, so it — not this page — decides what renders next.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return;
        }
        setLoadError(error);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Thrown during render, not inside the effect above, so the nearest
  // error boundary catches it — same pattern as src/pages/users/profile.tsx
  // and src/pages/admin/index.tsx.
  if (loadError) {
    throw loadError;
  }

  function selectTab(status: OrderStatus) {
    setActiveTab(status);
    setSelectedIds([]);
  }

  const isPending = activeTab === "PENDING";
  const rows = orders ? sortOrders(orders[activeTab], sort) : [];

  return (
    <RequireAdmin>
      <AdminShell>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order review</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Orders of $500.00 and above wait here until an administrator approves or denies them.
          </p>
        </div>
        <nav
          role="tablist"
          aria-label="Order status"
          className="border-border mt-5 flex gap-6 border-b"
        >
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={activeTab === status}
              onClick={() => selectTab(status)}
              className={cn(
                "flex items-center gap-2 border-b-2 pb-3 text-[14.5px] font-medium",
                activeTab === status
                  ? "border-foreground text-foreground font-semibold"
                  : "text-muted-foreground border-transparent",
              )}
            >
              {TAB_LABELS[status]}
              <span className="bg-secondary border-border inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[11.5px] font-semibold">
                {orders ? orders[status].length : 0}
              </span>
            </button>
          ))}
        </nav>
        <section className="bg-card border-border mt-5 overflow-hidden rounded-lg border">
          <div className="border-border flex items-center gap-3 border-b px-4 py-3">
            <span className="text-muted-foreground text-xs">
              {isPending ? "Select rows or use the status column, then commit." : READ_ONLY_NOTE}
            </span>
            <div className="flex-1" />
            <RefreshOrdersControl
              staged={staging.staged}
              onRefresh={() => void load()}
              onDiscard={staging.clear}
            />
          </div>
          {orders ? (
            <OrdersTable
              rows={rows}
              editable={isPending}
              staged={staging.staged}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onStage={staging.stage}
              sort={sort}
              onSortChange={setSort}
            />
          ) : (
            <p className="text-muted-foreground p-8 text-sm">Loading orders…</p>
          )}
          {isPending && staging.hasUncommittedChanges && (
            <div className="bg-secondary border-border flex items-center gap-3.5 border-t px-4 py-4">
              <span className="text-sm font-semibold">
                {staging.count} {staging.count === 1 ? "decision" : "decisions"} staged, not yet
                sent
              </span>
              <div className="flex-1" />
              <Button type="button" size="sm" onClick={() => setCommitOpen(true)}>
                Commit {staging.count} {staging.count === 1 ? "decision" : "decisions"}
              </Button>
            </div>
          )}
        </section>
      </AdminShell>
      <CommitDecisionsDialog
        open={commitOpen}
        request={staging.toRequest()}
        onClose={() => setCommitOpen(false)}
        onCommitted={() => {
          staging.clear();
          void load();
        }}
      />
    </RequireAdmin>
  );
}
