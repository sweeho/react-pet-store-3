import { and, eq } from "drizzle-orm";

import { cartItems } from "../db/schema";
import { type CartItem, createCartItem } from "./cart-item";
import { getItem } from "./catalog";
import { CatalogItemNotFoundError, ValidationError } from "./errors";
import { type DbOrTx, withTransaction } from "./transaction";

export const CART_COOKIE_NAME = "petstore_cart";
export const DEFAULT_CART_LOCALE = "en_US";

/** itemId -> quantity (design.md C2). */
export type CartDetails = Record<string, number>;

/**
 * The cart's current contents. A fresh object every call, `{}` for an
 * unknown or undefined token (SD1: "initialized empty" means no rows).
 */
export function getDetails(sessionToken: string | undefined, outer?: DbOrTx): CartDetails {
  if (sessionToken === undefined) {
    return {};
  }
  return withTransaction((tx) => {
    const rows = tx
      .select({ itemId: cartItems.itemId, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.sessionToken, sessionToken))
      .orderBy(cartItems.id)
      .all();
    const details: CartDetails = {};
    for (const row of rows) {
      details[row.itemId] = row.quantity;
    }
    return details;
  }, outer);
}

/**
 * Stores an item in the cart. Re-adding sets the quantity rather than
 * incrementing it (D5, legacy HashMap.put). An undefined token writes nothing.
 */
export function addItem(
  sessionToken: string | undefined,
  itemId: string,
  quantity = 1,
  outer?: DbOrTx,
): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError({ quantity: "Quantity must be a positive whole number" });
  }
  if (sessionToken === undefined) {
    return;
  }
  withTransaction((tx) => {
    tx.insert(cartItems)
      .values({ sessionToken, itemId, quantity })
      .onConflictDoUpdate({
        target: [cartItems.sessionToken, cartItems.itemId],
        set: { quantity },
      })
      .run();
  }, outer);
}

/** Removes one item from the cart; a no-op when it is absent. */
export function deleteItem(sessionToken: string | undefined, itemId: string, outer?: DbOrTx): void {
  if (sessionToken === undefined) {
    return;
  }
  withTransaction((tx) => {
    tx.delete(cartItems)
      .where(and(eq(cartItems.sessionToken, sessionToken), eq(cartItems.itemId, itemId)))
      .run();
  }, outer);
}

/**
 * Sets an item's quantity. Zero or below removes it; a positive quantity
 * upserts, which also adds an absent item (D5, SD14).
 */
export function updateItemQuantity(
  sessionToken: string | undefined,
  itemId: string,
  quantity: number,
  outer?: DbOrTx,
): void {
  if (quantity <= 0) {
    deleteItem(sessionToken, itemId, outer);
    return;
  }
  addItem(sessionToken, itemId, quantity, outer);
}

/**
 * The cart's items enriched from the catalogue, in insertion order. An item
 * the catalogue cannot supply is logged and skipped (D4, SD5).
 */
export function getItems(
  sessionToken: string | undefined,
  locale: string = DEFAULT_CART_LOCALE,
  outer?: DbOrTx,
): CartItem[] {
  if (sessionToken === undefined) {
    return [];
  }
  return withTransaction((tx) => {
    const rows = tx
      .select({ itemId: cartItems.itemId, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.sessionToken, sessionToken))
      .orderBy(cartItems.id)
      .all();
    const items: CartItem[] = [];
    for (const row of rows) {
      try {
        items.push(createCartItem(getItem(row.itemId, locale, tx), row.quantity));
      } catch (error) {
        if (!(error instanceof CatalogItemNotFoundError)) {
          throw error;
        }
        console.warn(`Cart item ${row.itemId} skipped: not found in the catalogue`);
      }
    }
    return items;
  }, outer);
}

export function getSubTotalCents(
  sessionToken: string | undefined,
  locale: string = DEFAULT_CART_LOCALE,
  outer?: DbOrTx,
): number {
  void sessionToken;
  void locale;
  void outer;
  throw new Error("VortexNotImplemented");
}
