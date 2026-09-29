import { lineItems, orderContacts, orders } from "../db/schema";
import { type CartItem, cartItemTotalCostCents } from "./cart-item";
import type { ContactInfo } from "./contact-info";
import type { CreditCard } from "./credit-card";
import type { DbOrTx } from "./transaction";

export interface PurchaseOrder {
  accountId: number;
  orderDate: Date;
  emailId: string;
  billTo: ContactInfo;
  shipTo: ContactInfo;
  creditCard: CreditCard;
  lines: CartItem[];
  totalCents: number;
}

/** Structurally the parsed checkout request (lib/checkout-request.ts OrderEvent, C6). */
export interface OrderEventInput {
  shipper: ContactInfo;
  receiver: ContactInfo;
  creditCard: CreditCard;
}

/** Builds the order from the parsed request; `emailId` is the billing email (SD, C8). */
export function toPurchaseOrder(
  accountId: number,
  event: OrderEventInput,
  lines: CartItem[],
  now: Date = new Date(),
): PurchaseOrder {
  return {
    accountId,
    orderDate: now,
    emailId: event.shipper.email,
    billTo: event.shipper,
    shipTo: event.receiver,
    creditCard: event.creditCard,
    lines,
    totalCents: lines.reduce((sum, line) => sum + cartItemTotalCostCents(line), 0),
  };
}

function contactRow(orderId: number, role: "BILL_TO" | "SHIP_TO", contact: ContactInfo) {
  return { orderId, role, ...contact };
}

/**
 * Writes the whole order through the caller's transaction and returns the new
 * order id: the orders row (PENDING), its two contact snapshots and one line
 * item per cart line, numbered from 1.
 */
export function insertPurchaseOrder(tx: DbOrTx, po: PurchaseOrder): number {
  const { id } = tx
    .insert(orders)
    .values({
      accountId: po.accountId,
      customerName: `${po.billTo.givenName} ${po.billTo.familyName}`,
      orderDate: po.orderDate,
      totalCents: po.totalCents,
      status: "PENDING",
      email: po.emailId,
      cardType: po.creditCard.cardType,
      cardNumber: po.creditCard.cardNumber,
      cardExpiry: po.creditCard.expiryDate,
    })
    .returning({ id: orders.id })
    .get();

  tx.insert(orderContacts)
    .values([contactRow(id, "BILL_TO", po.billTo), contactRow(id, "SHIP_TO", po.shipTo)])
    .run();

  if (po.lines.length > 0) {
    tx.insert(lineItems)
      .values(
        po.lines.map((line, index) => ({
          orderId: id,
          lineNumber: index + 1,
          categoryId: line.category,
          productId: line.productId,
          itemId: line.itemId,
          quantity: line.quantity,
          unitPriceCents: line.unitCostCents,
        })),
      )
      .run();
  }

  return id;
}
