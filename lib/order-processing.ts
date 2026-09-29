/**
 * Places, pays and confirms an order (design.md D3, C8, SD7, order-
 * processing-and-fulfilment): one immediate transaction that writes the order
 * (the non-logging core of placeOrder), authorises payment (stage PAID) and
 * queues the confirmation (stage CONFIRMED). Any failure, including a decline,
 * rolls all of it back and leaves the cart untouched. The checkout log line is
 * written once, after commit. Every collaborator is a static import, so there
 * is no runtime lookup that could fail to find one.
 */
import { logOrderPlaced, placeOrderInTx, type PlaceOrderInput } from "./checkout";
import { queueOrderConfirmation } from "./notifications";
import { authorizePayment, type PaymentAuthorizer } from "./payment";
import { type DbOrTx, withTransaction } from "./transaction";

export function processOrder(
  input: PlaceOrderInput,
  options: { authorizer?: PaymentAuthorizer } = {},
  outer?: DbOrTx,
): { orderId: number; orderDate: string; email: string } {
  const placed = withTransaction(
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
  logOrderPlaced(input.accountId, placed);
  return { orderId: placed.orderId, orderDate: placed.orderDate, email: placed.email };
}
