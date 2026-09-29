/**
 * The order confirmation outbox (design.md D4, C5, SD6). "Queued" is a row
 * in notification_outbox for customer-communications to deliver later;
 * nothing is sent here.
 */
import { notificationOutbox } from "../db/schema";
import { CONTACT_INFO_FIELDS } from "./contact-info";
import { getItem } from "./catalog";
import { CatalogItemNotFoundError } from "./errors";
import { getOrderRecord } from "./order-records";
import type { DbOrTx } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export const ORDER_CONFIRMATION = "ORDER_CONFIRMATION";

const CONFIRMATION_LOCALE = "en_US";

function itemName(itemId: string, tx: DbOrTx): string | undefined {
  try {
    return getItem(itemId, CONFIRMATION_LOCALE, tx).name;
  } catch (error) {
    if (error instanceof CatalogItemNotFoundError) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Moves the order from PAID to CONFIRMED and writes its ORDER_CONFIRMATION
 * row (status QUEUED, recipient the order email); returns the outbox id.
 * The stage change comes first, so an order at any other stage throws
 * before anything is written.
 */
export function queueOrderConfirmation(tx: DbOrTx, orderId: number): number {
  setWorkflowStage(tx, orderId, "CONFIRMED");

  const { order, lines, contacts } = getOrderRecord(orderId, tx);
  const shipToRow = contacts.find((c) => c.role === "SHIP_TO");
  // The address only: orderId and role are the row's key.
  const shipTo = shipToRow
    ? Object.fromEntries(CONTACT_INFO_FIELDS.map((f) => [f.key, shipToRow[f.key]]))
    : null;
  const email = order.email ?? "";

  const payload = {
    orderId,
    email,
    lines: lines.map((line) => ({
      itemId: line.itemId,
      name: itemName(line.itemId, tx),
      quantity: line.quantity,
      lineTotalCents: line.quantity * line.unitPriceCents,
    })),
    totalCents: order.totalCents,
    shipTo,
  };

  return tx
    .insert(notificationOutbox)
    .values({
      orderId,
      kind: ORDER_CONFIRMATION,
      recipient: email,
      payload: JSON.stringify(payload),
      status: "QUEUED",
      createdAt: new Date(),
    })
    .returning({ id: notificationOutbox.id })
    .get().id;
}
