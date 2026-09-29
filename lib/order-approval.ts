/**
 * Batch order approval service (design.md D6/D7, interface contract C4).
 * updateOrders runs every change in one withTransaction so a batch commits
 * or rolls back as a whole; a failing change's typed error (NotFoundError
 * or InvalidTransitionError, see lib/orders.ts updateOrderStatus) propagates
 * unchanged so the route can map it (SD4).
 *
 * lib/transaction.ts's withTransaction does not yet accept a `behavior`
 * option, so this runs in SQLite's default deferred transaction rather
 * than D6's "immediate" — atomicity (this ticket's AC) holds either way;
 * only concurrent-writer lock timing differs, and adding the option is
 * outside this ticket's file ownership.
 */
import { updateOrderStatus } from "./orders";
import type { AssignableStatus } from "./order-status";
import { withTransaction } from "./transaction";

export type ChangedOrder = { orderId: number; status: AssignableStatus };
export type OrderApproval = { changes: ChangedOrder[] };

export function updateOrders(approval: OrderApproval): { updated: number } {
  withTransaction((tx) => {
    for (const change of approval.changes) {
      updateOrderStatus(tx, change.orderId, change.status);
    }
  });

  // D7: logged without the actor, and only once the transaction above has
  // committed — a failure throws out of the block before this line runs.
  const entries = approval.changes.map((change) => `${change.orderId}→${change.status}`).join(", ");
  console.info(`order-approval: committed ${approval.changes.length} (${entries})`);

  return { updated: approval.changes.length };
}
