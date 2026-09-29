import type { DbOrTx } from "./transaction";

export const CART_COOKIE_NAME = "petstore_cart";
export const DEFAULT_CART_LOCALE = "en_US";

export type CartDetails = Record<string, number>;

export function getDetails(sessionToken: string | undefined, outer?: DbOrTx): CartDetails {
  void sessionToken;
  void outer;
  throw new Error("VortexNotImplemented");
}
