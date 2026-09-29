/**
 * Supplier order fulfilment (design.md D5, C8, supplier-portal-and-inventory).
 * Fulfilling a PENDING PO checks every line against stock and deducts it
 * all-or-nothing; when every PO of an order is PROCESSING the order reaches
 * ALLOCATED. Pending POs are retried in bulk, oldest first. Every attempt on
 * a PENDING PO is recorded and logged (design.md D10).
 */
import { asc, eq } from "drizzle-orm";

import {
  inventory,
  lineItems,
  orders,
  supplierFulfilmentAttempts,
  supplierPurchaseOrders,
} from "../db/schema";
import { NotFoundError } from "./errors";
import { reserveInventory } from "./inventory";
import { assertSupplierOrderTransition } from "./supplier-order-status";
import type { DbOrTx } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export interface ShortItem {
  itemId: string;
  needed: number;
  available: number;
}

export interface FulfilmentOutcome {
  result: "FULFILLED" | "UNABLE" | "SKIPPED";
  shortItems: ShortItem[];
}

function recordAttempt(
  tx: DbOrTx,
  poId: number,
  result: "FULFILLED" | "UNABLE",
  shortItems: ShortItem[],
): void {
  tx.insert(supplierFulfilmentAttempts)
    .values({
      supplierPoId: poId,
      attemptedAt: new Date(),
      result,
      detail: JSON.stringify(shortItems),
    })
    .run();
  const detail = shortItems
    .map((s) => `${s.itemId} needed ${s.needed}, available ${s.available}`)
    .join("; ");
  console.info(`supplier: PO ${poId} ${result}${detail ? ` (short: ${detail})` : ""}`);
}

/**
 * SKIPPED unless the PO is PENDING. UNABLE (nothing deducted, PO stays
 * PENDING) when any item's stock is below its total quantity on the PO's
 * lines; otherwise reserves the stock and moves the PO to PROCESSING.
 */
export function fulfilSupplierOrder(tx: DbOrTx, poId: number): FulfilmentOutcome {
  const po = tx
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.id, poId))
    .get();
  if (!po) {
    throw new NotFoundError(`Supplier PO ${poId} not found`);
  }
  if (po.status !== "PENDING") {
    return { result: "SKIPPED", shortItems: [] };
  }

  const lines = tx
    .select()
    .from(lineItems)
    .where(eq(lineItems.supplierPoId, poId))
    .orderBy(asc(lineItems.orderId), asc(lineItems.lineNumber))
    .all();

  const needed = new Map<string, number>();
  for (const line of lines) {
    needed.set(line.itemId, (needed.get(line.itemId) ?? 0) + line.quantity);
  }
  const shortItems: ShortItem[] = [];
  for (const [itemId, quantity] of needed) {
    const row = tx.select().from(inventory).where(eq(inventory.itemId, itemId)).get();
    const available = row?.quantity ?? 0;
    if (available < quantity) {
      shortItems.push({ itemId, needed: quantity, available });
    }
  }
  if (shortItems.length > 0 || !reserveInventory(tx, po.orderId, lines)) {
    recordAttempt(tx, poId, "UNABLE", shortItems);
    return { result: "UNABLE", shortItems };
  }

  assertSupplierOrderTransition(poId, "PENDING", "PROCESSING");
  tx.update(supplierPurchaseOrders)
    .set({ status: "PROCESSING" })
    .where(eq(supplierPurchaseOrders.id, poId))
    .run();

  const siblings = tx
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.orderId, po.orderId))
    .all();
  const order = tx.select().from(orders).where(eq(orders.id, po.orderId)).get();
  if (order?.workflowStage === "CONFIRMED" && siblings.every((p) => p.status === "PROCESSING")) {
    setWorkflowStage(tx, po.orderId, "ALLOCATED");
  }
  recordAttempt(tx, poId, "FULFILLED", []);
  return { result: "FULFILLED", shortItems: [] };
}

/** Runs every PENDING PO, oldest first, and counts how many were processed and fulfilled. */
export function processPendingSupplierOrders(tx: DbOrTx): { processed: number; fulfilled: number } {
  const pending = tx
    .select({ id: supplierPurchaseOrders.id })
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.status, "PENDING"))
    .orderBy(asc(supplierPurchaseOrders.id))
    .all();

  let fulfilled = 0;
  for (const { id } of pending) {
    if (fulfilSupplierOrder(tx, id).result === "FULFILLED") {
      fulfilled += 1;
    }
  }
  return { processed: pending.length, fulfilled };
}
