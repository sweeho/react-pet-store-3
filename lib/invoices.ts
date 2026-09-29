/**
 * Supplier invoices (design.md D9, C9, SD3 of supplier-portal-and-inventory).
 * Shipping a PO generates its invoice; the typed in-process call
 * `receiveInvoice` is the "topic" that delivers it to the order side, which
 * records shipped quantities and completes the order once every PO is done.
 * Everything runs through the caller's transaction. The delivery contact
 * shown on an invoice is the PO's contact, itself an immutable snapshot of
 * the order's SHIP_TO (D4).
 */
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { lineItems, supplierInvoices, supplierPurchaseOrders } from "../db/schema";
import { InvalidTransitionError, NotFoundError } from "./errors";
import { completeOrder } from "./orders";
import type { SupplierContact } from "./supplier-order-contacts";
import { getSupplierOrder } from "./supplier-orders";
import type { DbOrTx } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export interface InvoiceLine {
  itemId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Invoice {
  invoiceId: number;
  poId: number;
  orderId: number;
  invoiceDate: Date;
  lines: InvoiceLine[];
  totalCents: number;
  status: string;
  contact: SupplierContact | null;
}

/** Writes a SENT invoice for a COMPLETED PO and returns its id; any other PO status throws. */
export function generateInvoice(tx: DbOrTx, poId: number): number {
  const po = getSupplierOrder(poId, tx);
  if (po.poStatus !== "COMPLETED") {
    throw new InvalidTransitionError(poId, po.poStatus);
  }

  const lines: InvoiceLine[] = po.lines.map((line) => ({
    itemId: line.itemId,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.quantity * line.unitPriceCents,
  }));
  return tx
    .insert(supplierInvoices)
    .values({
      supplierPoId: poId,
      orderId: po.orderId,
      invoiceDate: new Date(),
      lines: JSON.stringify(lines),
      totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
      status: "SENT",
    })
    .returning({ id: supplierInvoices.id })
    .get().id;
}

/**
 * The order side's receipt of an invoice: sets `quantity_shipped` on the
 * PO's own lines, and when every PO of the order is COMPLETED moves the
 * stage to SHIPPED and the status to COMPLETED.
 */
export function receiveInvoice(tx: DbOrTx, invoiceId: number): { orderCompleted: boolean } {
  const invoice = getInvoice(invoiceId, tx);

  tx.update(lineItems)
    .set({ quantityShipped: lineItems.quantity })
    .where(eq(lineItems.supplierPoId, invoice.poId))
    .run();

  const pos = tx
    .select({ status: supplierPurchaseOrders.status })
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.orderId, invoice.orderId))
    .all();
  if (!pos.every((po) => po.status === "COMPLETED")) {
    return { orderCompleted: false };
  }

  setWorkflowStage(tx, invoice.orderId, "SHIPPED");
  completeOrder(tx, invoice.orderId);
  return { orderCompleted: true };
}

export function getInvoice(invoiceId: number, tx?: DbOrTx): Invoice {
  const conn = tx ?? db;
  const row = conn.select().from(supplierInvoices).where(eq(supplierInvoices.id, invoiceId)).get();
  if (!row) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }
  return {
    invoiceId: row.id,
    poId: row.supplierPoId,
    orderId: row.orderId,
    invoiceDate: row.invoiceDate,
    // The column is JSON written only by generateInvoice above.
    lines: JSON.parse(row.lines) as InvoiceLine[],
    totalCents: row.totalCents,
    status: row.status,
    contact: getSupplierOrder(row.supplierPoId, conn).contact,
  };
}
