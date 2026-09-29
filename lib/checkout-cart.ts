/**
 * The checkout's view of the cart (design.md C7): the enriched lines read
 * inside the caller's transaction, or ShoppingCartEmptyError when there is
 * nothing to order (no token, no rows, or only items the catalogue lost).
 */
import { getItems } from "./cart";
import type { CartItem } from "./cart-item";
import { ShoppingCartEmptyError } from "./errors";
import type { DbOrTx } from "./transaction";

export function getCheckoutLines(
  cartToken: string | undefined,
  locale: string,
  tx: DbOrTx,
): CartItem[] {
  const lines = getItems(cartToken, locale, tx);
  if (lines.length === 0) {
    throw new ShoppingCartEmptyError();
  }
  return lines;
}
