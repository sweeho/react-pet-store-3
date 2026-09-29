import type { OrderConfirmation } from "../src/types/checkout";

export function getOrderConfirmation(accountId: number, orderId: number): OrderConfirmation {
  void accountId;
  void orderId;
  throw new Error("VortexNotImplemented");
}
