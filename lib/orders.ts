/**
 * Orders read/write service (design.md D1/D2/D6, interface contract C3).
 * getOrdersGroupedByStatus always returns all four ORDER_STATUSES keys, an
 * empty array for a status with no rows. updateOrderStatus is called from
 * inside a withTransaction (lib/transaction.ts) when part of a batch (D6);
 * given the plain db it runs as its own implicit single-statement write.
 */
import { and, asc, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { NotFoundError } from "./errors";
import { ORDER_STATUSES, assertTransition } from "./order-status";
import type { AssignableStatus, OrderStatus } from "./order-status";
import type { DbOrTx } from "./transaction";
import { orders } from "../db/schema";
import { db } from "../db/client";

export type OrderRow = {
  id: number;
  customerName: string;
  orderDate: string;
  totalCents: number;
  status: OrderStatus;
};

type OrderTableRow = InferSelectModel<typeof orders>;

function toOrderRow(row: OrderTableRow): OrderRow {
  return {
    id: row.id,
    customerName: row.customerName,
    orderDate: row.orderDate.toISOString(),
    totalCents: row.totalCents,
    // schema.ts stores status as plain text (no $type) to stay free of a
    // lib/ import (see db/schema.ts); every writer is lib/orders.ts and
    // only ever writes an OrderStatus, so this narrows what SQLite gives
    // back rather than validating an external input.
    status: row.status as OrderStatus,
  };
}

export function listOrdersByStatus(status: OrderStatus): OrderRow[] {
  return db
    .select()
    .from(orders)
    .where(eq(orders.status, status))
    .orderBy(asc(orders.orderDate))
    .all()
    .map(toOrderRow);
}

export function getOrdersGroupedByStatus(): Record<OrderStatus, OrderRow[]> {
  const grouped = {} as Record<OrderStatus, OrderRow[]>;
  for (const status of ORDER_STATUSES) {
    grouped[status] = listOrdersByStatus(status);
  }
  return grouped;
}

export function updateOrderStatus(tx: DbOrTx, orderId: number, to: AssignableStatus): void {
  const row = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!row) {
    throw new NotFoundError(`Order ${orderId} not found`);
  }

  // schema.ts stores status as plain text (see toOrderRow's comment above).
  assertTransition(orderId, row.status as OrderStatus, to);

  tx.update(orders)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "PENDING")))
    .run();
}
