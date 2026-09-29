/**
 * The supplier order read model (design.md C4, D2, D4, SD5 of supplier-portal-
 * and-inventory): a supplier PO with its delivery contact, address and line
 * items. `poId` is the PO's integer id and `poDate` its `created_at` (SD2).
 * The contact and address are read for shipping only and never displayed in
 * the portal (SD5); a PO created before they are copied reads them as null.
 */
import { asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { lineItems, supplierPurchaseOrders } from "../db/schema";
import { NotFoundError } from "./errors";
import { getSupplierAddress, type SupplierAddress } from "./supplier-order-addresses";
import { getSupplierContact, type SupplierContact } from "./supplier-order-contacts";
import type { SupplierOrderStatus } from "./supplier-order-status";
import type { DbOrTx } from "./transaction";

/** A PO's line item with all seven attributes (`unitPriceCents` is the spec's unitPrice). */
export interface SupplierOrderLine {
  itemId: string;
  quantity: number;
  quantityShipped: number;
  lineNumber: number;
  categoryId: string;
  productId: string;
  unitPriceCents: number;
}

export interface SupplierOrder {
  poId: number;
  poDate: Date;
  poStatus: SupplierOrderStatus;
  orderId: number;
  supplierId: string;
  expectedDeliveryDate: Date;
  trackingNumber: string | null;
  contact: SupplierContact | null;
  address: SupplierAddress | null;
  lines: SupplierOrderLine[];
}

type PoRow = typeof supplierPurchaseOrders.$inferSelect;

function orNull<T>(read: () => T): T | null {
  try {
    return read();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
}

function toSupplierOrder(po: PoRow, conn: DbOrTx): SupplierOrder {
  const lines = conn
    .select()
    .from(lineItems)
    .where(eq(lineItems.supplierPoId, po.id))
    .orderBy(asc(lineItems.orderId), asc(lineItems.lineNumber))
    .all()
    .map((row) => ({
      itemId: row.itemId,
      quantity: row.quantity,
      quantityShipped: row.quantityShipped,
      lineNumber: row.lineNumber,
      categoryId: row.categoryId,
      productId: row.productId,
      unitPriceCents: row.unitPriceCents,
    }));
  return {
    poId: po.id,
    poDate: po.createdAt,
    // The column is free text; migration 0007 and lib/supplier-order-status.ts keep it to the three values.
    poStatus: po.status as SupplierOrderStatus,
    orderId: po.orderId,
    supplierId: po.supplierId,
    expectedDeliveryDate: po.expectedDeliveryDate,
    trackingNumber: po.trackingNumber,
    contact: orNull(() => getSupplierContact(po.id, conn)),
    address: orNull(() => getSupplierAddress(po.id, conn)),
    lines,
  };
}

export function getSupplierOrder(poId: number, tx?: DbOrTx): SupplierOrder {
  const conn = tx ?? db;
  const po = conn
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.id, poId))
    .get();
  if (!po) {
    throw new NotFoundError(`Supplier PO ${poId} not found`);
  }
  return toSupplierOrder(po, conn);
}

/** Every PO, or only those at `status`, oldest first. */
export function listSupplierOrders(status?: SupplierOrderStatus, tx?: DbOrTx): SupplierOrder[] {
  const conn = tx ?? db;
  const query = conn.select().from(supplierPurchaseOrders);
  const rows = (
    status === undefined ? query : query.where(eq(supplierPurchaseOrders.status, status))
  )
    .orderBy(asc(supplierPurchaseOrders.id))
    .all();
  return rows.map((po) => toSupplierOrder(po, conn));
}

/**
 * Deletes a PO; its contact and address go with it by cascade. Its line items
 * are unlinked, not deleted (they belong to the order). For cascade tests only.
 */
export function deleteSupplierOrder(tx: DbOrTx, poId: number): void {
  tx.update(lineItems).set({ supplierPoId: null }).where(eq(lineItems.supplierPoId, poId)).run();
  tx.delete(supplierPurchaseOrders).where(eq(supplierPurchaseOrders.id, poId)).run();
}
