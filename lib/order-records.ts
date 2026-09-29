/**
 * The order finders (design.md C2, tasks 12.5, order-processing-and-
 * fulfilment): read a whole order back, or list orders at a workflow stage.
 * Read-only; pass a caller's transaction to read inside it.
 */
import { asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import {
  inventoryReservations,
  lineItems,
  notificationOutbox,
  orderContacts,
  orderStageHistory,
  orders,
  paymentAuthorizations,
  supplierPurchaseOrders,
} from "../db/schema";
import { NotFoundError } from "./errors";
import type { DbOrTx } from "./transaction";

export interface OrderRecord {
  order: typeof orders.$inferSelect;
  lines: Array<typeof lineItems.$inferSelect>;
  contacts: Array<typeof orderContacts.$inferSelect>;
  stageHistory: Array<typeof orderStageHistory.$inferSelect>;
  payment: typeof paymentAuthorizations.$inferSelect | null;
  outbox: Array<typeof notificationOutbox.$inferSelect>;
  reservations: Array<typeof inventoryReservations.$inferSelect>;
  supplierPos: Array<typeof supplierPurchaseOrders.$inferSelect>;
}

/** The order with its lines, contacts, stage history, payment, outbox, reservations and supplier POs. */
export function getOrderRecord(orderId: number, tx?: DbOrTx): OrderRecord {
  const conn = tx ?? db;
  const order = conn.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return {
    order,
    lines: conn
      .select()
      .from(lineItems)
      .where(eq(lineItems.orderId, orderId))
      .orderBy(asc(lineItems.lineNumber))
      .all(),
    contacts: conn.select().from(orderContacts).where(eq(orderContacts.orderId, orderId)).all(),
    stageHistory: conn
      .select()
      .from(orderStageHistory)
      .where(eq(orderStageHistory.orderId, orderId))
      .orderBy(asc(orderStageHistory.id))
      .all(),
    payment:
      conn
        .select()
        .from(paymentAuthorizations)
        .where(eq(paymentAuthorizations.orderId, orderId))
        .get() ?? null,
    outbox: conn
      .select()
      .from(notificationOutbox)
      .where(eq(notificationOutbox.orderId, orderId))
      .orderBy(asc(notificationOutbox.id))
      .all(),
    reservations: conn
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId))
      .all(),
    supplierPos: conn
      .select()
      .from(supplierPurchaseOrders)
      .where(eq(supplierPurchaseOrders.orderId, orderId))
      .orderBy(asc(supplierPurchaseOrders.id))
      .all(),
  };
}

/** Orders whose workflow stage is `stage`, oldest first. */
export function listOrdersByStage(stage: string, tx?: DbOrTx): Array<typeof orders.$inferSelect> {
  return (tx ?? db)
    .select()
    .from(orders)
    .where(eq(orders.workflowStage, stage))
    .orderBy(asc(orders.id))
    .all();
}
