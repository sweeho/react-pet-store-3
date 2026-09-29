import { eq } from "drizzle-orm";

import { cartItems } from "../db/schema";
import { ValidationError } from "./errors";
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

export function deleteItem(sessionToken: string | undefined, itemId: string, outer?: DbOrTx): void {
  void sessionToken;
  void itemId;
  void outer;
  throw new Error("VortexNotImplemented");
}
