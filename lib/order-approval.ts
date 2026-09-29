/**
 * Batch order approval service (design.md D6/D7, interface contract C4).
 * updateOrders runs every change in one immediate-mode withTransaction (D6,
 * C8) so a batch commits or rolls back as a whole; a failing change's typed
 * error (NotFoundError or InvalidTransitionError, see lib/orders.ts
 * updateOrderStatus) propagates unchanged so the route can map it (SD4).
 * Immediate mode takes the write lock at BEGIN, so a second administrator's
 * overlapping commit waits and then fails cleanly on the now non-PENDING
 * row instead of lost-updating it.
 */
import { updateOrderStatus } from "./orders";
import type { AssignableStatus } from "./order-status";
import { withTransaction } from "./transaction";

export type ChangedOrder = { orderId: number; status: AssignableStatus };
export type OrderApproval = { changes: ChangedOrder[] };

export function updateOrders(approval: OrderApproval): { updated: number } {
  withTransaction(
    (tx) => {
      for (const change of approval.changes) {
        updateOrderStatus(tx, change.orderId, change.status);
      }
    },
    undefined,
    { behavior: "immediate" },
  );

  // D7: logged without the actor, and only once the transaction above has
  // committed — a failure throws out of the block before this line runs.
  const entries = approval.changes.map((change) => `${change.orderId}→${change.status}`).join(", ");
  console.info(`order-approval: committed ${approval.changes.length} (${entries})`);

  return { updated: approval.changes.length };
}
