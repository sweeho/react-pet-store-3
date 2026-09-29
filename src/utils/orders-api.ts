import type { OrderConfirmation, PlacedOrder } from "@/types/checkout";

export function placeOrder(fields: Record<string, string>): Promise<PlacedOrder> {
  void fields;
  throw new Error("VortexNotImplemented");
}

export function getOrder(id: number): Promise<OrderConfirmation> {
  void id;
  throw new Error("VortexNotImplemented");
}
