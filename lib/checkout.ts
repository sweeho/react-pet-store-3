/**
 * Places an order (design.md D4, D11, C8, SD2): one immediate-mode
 * transaction that reads the cart, writes the order with its contact and
 * line snapshots, and empties the cart. Any failure rolls all of it back,
 * leaving the cart untouched (SD13). Given an outer transaction it joins it.
 */
import { empty } from "./cart";
import { getCheckoutLines } from "./checkout-cart";
import { type OrderEventInput, insertPurchaseOrder, toPurchaseOrder } from "./purchase-orders";
import { type DbOrTx, withTransaction } from "./transaction";

export interface PlaceOrderInput {
  accountId: number;
  cartToken: string | undefined;
  locale: string;
  event: OrderEventInput;
}

export function placeOrder(
  { accountId, cartToken, locale, event }: PlaceOrderInput,
  outer?: DbOrTx,
): { orderId: number; orderDate: string; email: string } {
  const placed = withTransaction(
    (tx) => {
      const lines = getCheckoutLines(cartToken, locale, tx);
      const purchaseOrder = toPurchaseOrder(accountId, event, lines);
      const orderId = insertPurchaseOrder(tx, purchaseOrder);
      empty(cartToken, tx);
      return {
        orderId,
        orderDate: purchaseOrder.orderDate.toISOString(),
        email: purchaseOrder.emailId,
        lineCount: lines.length,
        totalCents: purchaseOrder.totalCents,
      };
    },
    outer,
    { behavior: "immediate" },
  );
  // D11: logged once the transaction has committed (or, given an outer
  // transaction, once this work is done), so a rolled-back order never logs.
  console.info(
    `checkout: order ${placed.orderId} placed by account ${accountId}, ${placed.lineCount} lines, ${placed.totalCents} cents`,
  );
  return { orderId: placed.orderId, orderDate: placed.orderDate, email: placed.email };
}
