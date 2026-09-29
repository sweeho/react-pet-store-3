import type { CartItem } from "./cart-item";
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

export function toPurchaseOrder(
  accountId: number,
  event: OrderEventInput,
  lines: CartItem[],
  now: Date = new Date(),
): PurchaseOrder {
  void accountId;
  void event;
  void lines;
  void now;
  throw new Error("VortexNotImplemented");
}

export function insertPurchaseOrder(tx: DbOrTx, po: PurchaseOrder): number {
  void tx;
  void po;
  throw new Error("VortexNotImplemented");
}
