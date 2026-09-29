/**
 * Supplier purchase orders (design.md D6, D7, C7). An order's lines are
 * grouped by supplier into one PO each, due `SUPPLIER_LEAD_DAYS` after
 * allocation; a PO is later marked shipped with the supplier's tracking
 * number. Both run through the caller's transaction.
 */
import { and, eq } from "drizzle-orm";

import { lineItems, supplierPurchaseOrders } from "../db/schema";
import { InvalidTransitionError, NotFoundError } from "./errors";
import { SUPPLIER_LEAD_DAYS, supplierForItem } from "./suppliers";
import type { DbOrTx } from "./transaction";

/** The identifying part of a `line_items` row. */
export interface SupplierPoLine {
  lineNumber: number;
  itemId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Creates one OPEN PO per supplier, links each line to it, and returns the PO ids. */
export function createSupplierPOs(
  tx: DbOrTx,
  orderId: number,
  lines: SupplierPoLine[],
  now: Date = new Date(),
): number[] {
  const bySupplier = new Map<string, SupplierPoLine[]>();
  for (const line of lines) {
    const supplierId = supplierForItem(line.itemId);
    const group = bySupplier.get(supplierId);
    if (group) {
      group.push(line);
    } else {
      bySupplier.set(supplierId, [line]);
    }
  }

  const expectedDeliveryDate = new Date(now.getTime() + SUPPLIER_LEAD_DAYS * DAY_MS);
  const ids: number[] = [];
  for (const [supplierId, group] of bySupplier) {
    const { id } = tx
      .insert(supplierPurchaseOrders)
      .values({ orderId, supplierId, status: "OPEN", expectedDeliveryDate, createdAt: now })
      .returning({ id: supplierPurchaseOrders.id })
      .get();
    for (const line of group) {
      tx.update(lineItems)
        .set({ supplierPoId: id })
        .where(and(eq(lineItems.orderId, orderId), eq(lineItems.lineNumber, line.lineNumber)))
        .run();
    }
    ids.push(id);
  }
  return ids;
}

/** Marks an OPEN PO SHIPPED with the supplier's tracking number. */
export function markPoShipped(tx: DbOrTx, supplierPoId: number, trackingNumber: string): void {
  const po = tx
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.id, supplierPoId))
    .get();
  if (!po) {
    throw new NotFoundError(`Supplier PO ${supplierPoId} not found`);
  }
  if (po.status !== "OPEN") {
    // InvalidTransitionError's message names an "Order"; here the id is the PO's.
    throw new InvalidTransitionError(supplierPoId, po.status);
  }
  tx.update(supplierPurchaseOrders)
    .set({ status: "SHIPPED", trackingNumber, shippedAt: new Date() })
    .where(eq(supplierPurchaseOrders.id, supplierPoId))
    .run();
}
