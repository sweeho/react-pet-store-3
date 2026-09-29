/**
 * The order process manager (design.md D5, D7, D8, C9): allocates an approved
 * order or leaves it waiting at CONFIRMED, retries waiting orders, and
 * completes an order once every supplier PO has shipped.
 */
import { and, asc, eq } from "drizzle-orm";

import { lineItems, orders, supplierPurchaseOrders } from "../db/schema";
import { reserveInventory } from "./inventory";
import { NotFoundError } from "./errors";
import { completeOrder } from "./orders";
import { createSupplierPOs, markPoShipped } from "./supplier-pos";
import { type DbOrTx, withTransaction } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export type AllocationResult = "ALLOCATED" | "WAITING" | "SKIPPED";

/**
 * SKIPPED unless the order is APPROVED and at CONFIRMED. Otherwise reserves
 * stock; when covered, creates the supplier POs and moves to ALLOCATED, and
 * when not, returns WAITING having written nothing.
 */
export function allocateOrder(tx: DbOrTx, orderId: number): AllocationResult {
  const order = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order || order.status !== "APPROVED" || order.workflowStage !== "CONFIRMED") {
    return "SKIPPED";
  }

  const lines = tx
    .select()
    .from(lineItems)
    .where(eq(lineItems.orderId, orderId))
    .orderBy(asc(lineItems.lineNumber))
    .all();
  if (!reserveInventory(tx, orderId, lines)) {
    return "WAITING";
  }

  createSupplierPOs(tx, orderId, lines);
  setWorkflowStage(tx, orderId, "ALLOCATED");
  return "ALLOCATED";
}

/** Re-runs allocation for every APPROVED order still at CONFIRMED; returns how many were allocated. */
export function retryWaitingAllocations(): number {
  const candidates = withTransaction((tx) =>
    tx
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.status, "APPROVED"), eq(orders.workflowStage, "CONFIRMED")))
      .orderBy(asc(orders.id))
      .all(),
  );

  let allocated = 0;
  for (const { id } of candidates) {
    const result = withTransaction((tx) => allocateOrder(tx, id), undefined, {
      behavior: "immediate",
    });
    if (result === "ALLOCATED") {
      allocated += 1;
    }
  }
  return allocated;
}

/**
 * Marks the PO shipped with its tracking number. When every PO of the order
 * has shipped, the stage becomes SHIPPED and the status COMPLETED.
 */
export function recordShipment(
  supplierPoId: number,
  trackingNumber: string,
): { orderCompleted: boolean } {
  return withTransaction(
    (tx) => {
      const po = tx
        .select()
        .from(supplierPurchaseOrders)
        .where(eq(supplierPurchaseOrders.id, supplierPoId))
        .get();
      if (!po) {
        throw new NotFoundError(`Supplier PO ${supplierPoId} not found`);
      }

      markPoShipped(tx, supplierPoId, trackingNumber);

      const all = tx
        .select()
        .from(supplierPurchaseOrders)
        .where(eq(supplierPurchaseOrders.orderId, po.orderId))
        .all();
      if (!all.every((p) => p.status === "SHIPPED")) {
        return { orderCompleted: false };
      }

      setWorkflowStage(tx, po.orderId, "SHIPPED");
      completeOrder(tx, po.orderId);
      return { orderCompleted: true };
    },
    undefined,
    { behavior: "immediate" },
  );
}
