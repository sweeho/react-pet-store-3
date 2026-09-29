import type { PlaceOrderInput } from "./checkout";
import type { PaymentAuthorizer } from "./payment";
import type { DbOrTx } from "./transaction";

export function processOrder(
  input: PlaceOrderInput,
  options?: { authorizer?: PaymentAuthorizer },
  outer?: DbOrTx,
): { orderId: number; orderDate: string; email: string } {
  void input;
  void options;
  void outer;
  throw new Error("VortexNotImplemented");
}
