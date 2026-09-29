/**
 * Places, pays and confirms an order (design.md D3, C8, SD7, order-
 * processing-and-fulfilment): one immediate transaction that writes the order
 * (the non-logging core of placeOrder), authorises payment (stage PAID) and
 * queues the confirmation (stage CONFIRMED). Any failure, including a decline,
 * rolls all of it back and leaves the cart untouched. The checkout log line is
 * written once, after commit. Every collaborator is a static import, so there
 * is no runtime lookup that could fail to find one. A decline is logged as a
 * warning and any unexpected failure as an error, both naming the account and
 * carrying no card data (tasks 13.5, SD6).
 */
import { PaymentDeclinedError, ShoppingCartEmptyError } from "./errors";
import { logOrderPlaced, placeOrderInTx, type PlaceOrderInput } from "./checkout";
import { queueOrderConfirmation } from "./notifications";
import { authorizePayment, type PaymentAuthorizer } from "./payment";
import { type DbOrTx, withTransaction } from "./transaction";

export function processOrder(
  input: PlaceOrderInput,
  options: { authorizer?: PaymentAuthorizer } = {},
  outer?: DbOrTx,
): { orderId: number; orderDate: string; email: string } {
  let placed;
  try {
    placed = withTransaction(
      (tx) => {
        const order = placeOrderInTx(tx, input);
        authorizePayment(
          tx,
          order.orderId,
          input.event.creditCard,
          order.totalCents,
          options.authorizer,
        );
        queueOrderConfirmation(tx, order.orderId);
        return order;
      },
      outer,
      { behavior: "immediate" },
    );
  } catch (error) {
    if (error instanceof PaymentDeclinedError) {
      console.warn(`order-workflow: payment declined for account ${input.accountId}`);
    } else if (!(error instanceof ShoppingCartEmptyError)) {
      console.error(`order-workflow: order failed for account ${input.accountId}`, error);
    }
    throw error;
  }
  logOrderPlaced(input.accountId, placed);
  return { orderId: placed.orderId, orderDate: placed.orderDate, email: placed.email };
}
