/**
 * Orders read/write service (design.md D1/D2/D6, interface contract C3).
 * getOrdersGroupedByStatus always returns all four ORDER_STATUSES keys, an
 * empty array for a status with no rows. updateOrderStatus is called from
 * inside a withTransaction (lib/transaction.ts) when part of a batch (D6);
 * given the plain db it runs as its own implicit single-statement write.
 */
import type { AssignableStatus, OrderStatus } from "./order-status";
import type { DbOrTx } from "./transaction";

export type OrderRow = {
  id: number;
  customerName: string;
  orderDate: string;
  totalCents: number;
  status: OrderStatus;
};

export function listOrdersByStatus(status: OrderStatus): OrderRow[] {
  void status;
  throw new Error("VortexNotImplemented");
}

export function getOrdersGroupedByStatus(): Record<OrderStatus, OrderRow[]> {
  throw new Error("VortexNotImplemented");
}

export function updateOrderStatus(tx: DbOrTx, orderId: number, to: AssignableStatus): void {
  void tx;
  void orderId;
  void to;
  throw new Error("VortexNotImplemented");
}
