/**
 * Batch order approval service (design.md D6/D7, interface contract C4).
 * updateOrders runs every change in one withTransaction so a batch commits
 * or rolls back as a whole; a failing change's typed error (NotFoundError
 * or InvalidTransitionError, see lib/orders.ts updateOrderStatus) propagates
 * unchanged so the route can map it (SD4).
 */
import type { AssignableStatus } from "./order-status";

export type ChangedOrder = { orderId: number; status: AssignableStatus };
export type OrderApproval = { changes: ChangedOrder[] };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- red-phase stub
export function updateOrders(approval: OrderApproval): { updated: number } {
  throw new Error("VortexNotImplemented");
}
