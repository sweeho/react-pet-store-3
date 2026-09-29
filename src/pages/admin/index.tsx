/**
 * /admin (design.md D9, mockup-admin-home.html): the four status counts
 * from GET /api/admin/orders and a link into the queue. No Reports card or
 * nav link — that belongs to admin-dashboard (swhr3-i-0008), not built yet
 * (SD14).
 */
import { Link } from "react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui";
import { ORDER_STATUSES } from "@/constants/order-status";
import type { OrdersByStatus } from "@/types/order-approval";
import { ApiError } from "@/utils/api";
import { fetchOrdersByStatus } from "@/utils/admin-orders-api";

export default function AdminHome() {
  const [orders, setOrders] = useState<OrdersByStatus | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetchOrdersByStatus()
      .then((result) => {
        if (!cancelled) {
          setOrders(result);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        // A signed-out or non-admin visitor's effect races RequireAdmin's
        // own session check below; a 401/403 here means that gate is about
        // to redirect, so it — not this page — decides what renders next.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return;
        }
        setLoadError(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Thrown during render, not inside the effect above, so the nearest
  // error boundary catches it (an effect's throw is invisible to React) —
  // same pattern as src/pages/users/profile.tsx.
  if (loadError) {
    throw loadError;
  }

  const pendingCount = orders ? orders.PENDING.length : 0;

  return (
    <RequireAdmin>
      <AdminShell>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1.5">
          Review the orders held for approval, and see how the store is selling.
        </p>
        <section className="bg-card border-border mt-7 rounded-lg border p-7">
          <h2 className="text-xl font-semibold">
            {orders ? `${pendingCount} orders are waiting for a decision` : "Loading orders…"}
          </h2>
          <p className="text-muted-foreground mt-2.5 max-w-prose text-sm">
            Orders of $500.00 and above are held until an administrator approves or denies them.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {ORDER_STATUSES.map((status) => (
              <div key={status} className="border-border rounded-md border p-3.5">
                <div className="text-2xl font-bold tabular-nums">
                  {orders ? orders[status].length : "–"}
                </div>
                <div className="text-muted-foreground mt-0.5 text-[11px] font-semibold tracking-wide">
                  {status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild>
              <Link to="/admin/orders">Open order review</Link>
            </Button>
          </div>
        </section>
      </AdminShell>
    </RequireAdmin>
  );
}
