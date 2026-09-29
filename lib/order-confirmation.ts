/**
 * Reads an order back for its owner (design.md C9, D3, D7). Joins orders,
 * order_contacts and line_items, masks the card to its last four digits, and
 * treats another account's order exactly like a missing one. Line names and
 * attributes come from the catalogue (default locale); an item the catalogue
 * no longer has shows its id, since the order stores ids and prices only.
 */
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { lineItems, orderContacts, orders } from "../db/schema";
import type { CartLine } from "../src/types/cart";
import type { OrderConfirmation } from "../src/types/checkout";
import { DEFAULT_CART_LOCALE } from "./cart";
import { getItem } from "./catalog";
import type { ContactInfo } from "./contact-info";
import { maskCardNumber } from "./credit-card";
import { CatalogItemNotFoundError, NotFoundError } from "./errors";

type ContactRow = typeof orderContacts.$inferSelect;

function toContactInfo(row: ContactRow): ContactInfo {
  return {
    familyName: row.familyName,
    givenName: row.givenName,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    stateOrProvince: row.stateOrProvince,
    postalCode: row.postalCode,
    country: row.country,
    telephoneNumber: row.telephoneNumber,
    email: row.email,
  };
}

function nameAndAttribute(itemId: string): { name: string; attribute: string } {
  try {
    const item = getItem(itemId, DEFAULT_CART_LOCALE);
    return { name: item.name, attribute: item.attribute };
  } catch (error) {
    if (error instanceof CatalogItemNotFoundError) {
      return { name: itemId, attribute: "" };
    }
    throw error;
  }
}

export function getOrderConfirmation(accountId: number, orderId: number): OrderConfirmation {
  const order = db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.accountId, accountId)))
    .get();
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  const contacts = db.select().from(orderContacts).where(eq(orderContacts.orderId, orderId)).all();
  const billTo = contacts.find((c) => c.role === "BILL_TO");
  const shipTo = contacts.find((c) => c.role === "SHIP_TO");
  if (!billTo || !shipTo) {
    // Orders seeded before checkout existed have no snapshots to show.
    throw new NotFoundError("Order not found");
  }

  const lines: CartLine[] = db
    .select()
    .from(lineItems)
    .where(eq(lineItems.orderId, orderId))
    .orderBy(lineItems.lineNumber)
    .all()
    .map((row) => ({
      itemId: row.itemId,
      productId: row.productId,
      category: row.categoryId,
      ...nameAndAttribute(row.itemId),
      quantity: row.quantity,
      unitCostCents: row.unitPriceCents,
      totalCostCents: row.quantity * row.unitPriceCents,
    }));

  return {
    orderId: order.id,
    orderDate: order.orderDate.toISOString(),
    email: order.email ?? billTo.email,
    billTo: toContactInfo(billTo),
    shipTo: toContactInfo(shipTo),
    card: {
      cardType: order.cardType ?? "",
      last4: maskCardNumber(order.cardNumber ?? ""),
      expiryDate: order.cardExpiry ?? "",
    },
    lines,
    totalCents: order.totalCents,
  };
}
