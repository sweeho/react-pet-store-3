import type { CartView } from "@/types/cart";

export function getCart(): Promise<CartView> {
  throw new Error("VortexNotImplemented");
}

export function addToCart(itemId: string, quantity?: number): Promise<CartView> {
  void itemId;
  void quantity;
  throw new Error("VortexNotImplemented");
}

export function updateCart(fields: Record<string, string>): Promise<CartView> {
  void fields;
  throw new Error("VortexNotImplemented");
}

export function removeFromCart(itemId: string): Promise<CartView> {
  void itemId;
  throw new Error("VortexNotImplemented");
}

export function emptyCart(): Promise<CartView> {
  throw new Error("VortexNotImplemented");
}
