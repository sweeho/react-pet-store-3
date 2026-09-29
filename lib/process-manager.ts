/**
 * The order process manager (design.md D5, D7, D8, C9): allocates an approved
 * order or leaves it waiting at CONFIRMED, retries waiting orders, and
 * completes an order once every supplier PO has shipped.
 */
import { asc, eq } from "drizzle-orm";

import { lineItems, orders, supplierPurchaseOrders } from "../db/schema";
import { NotFoundError } from "./errors";
import { completeOrder } from "./orders";
import { fulfilSupplierOrder, processPendingSupplierOrders } from "./supplier-fulfilment";
import { createSupplierPOs, markPoShipped } from "./supplier-pos";
import { type DbOrTx, withTransaction } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export type AllocationResult = "ALLOCATED" | "WAITING" | "SKIPPED";

/**
 * SKIPPED unless the order is APPROVED and at CONFIRMED. Otherwise creates
 * the order's supplier POs as PENDING (with delivery contact and address) and
 * tries to fulfil each (design.md D3, supplier-portal-and-inventory). ALLOCATED
 * when the order reached that stage; WAITING when stock was short, leaving the
 * order at CONFIRMED with its PENDING PO and nothing deducted.
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

  for (const poId of createSupplierPOs(tx, orderId, lines)) {
    fulfilSupplierOrder(tx, poId);
  }

  const after = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  return after?.workflowStage === "ALLOCATED" ? "ALLOCATED" : "WAITING";
}

/** Retries every PENDING supplier PO in one immediate transaction; returns how many were fulfilled. */
export function retryWaitingAllocations(): number {
  return withTransaction((tx) => processPendingSupplierOrders(tx).fulfilled, undefined, {
    behavior: "immediate",
  });
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
      if (!all.every((p) => p.status === "COMPLETED")) {
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
