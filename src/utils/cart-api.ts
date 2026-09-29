/**
 * The cart client (design.md C9, C10). One function per /api/cart endpoint,
 * each through apiFetch and each answering the whole CartView (D9).
 */
import type { CartView } from "@/types/cart";
import { apiFetch } from "./api";

const CART_API_PATH = "/api/cart";

export function getCart(): Promise<CartView> {
  return apiFetch<CartView>(CART_API_PATH);
}

export function addToCart(itemId: string, quantity?: number): Promise<CartView> {
  return apiFetch<CartView>(CART_API_PATH, {
    method: "POST",
    body: quantity === undefined ? { itemId } : { itemId, quantity },
  });
}

/** `fields` are the form's `itemQuantity_<itemId>` entries. */
export function updateCart(fields: Record<string, string>): Promise<CartView> {
  return apiFetch<CartView>(CART_API_PATH, { method: "PUT", body: fields });
}

export function removeFromCart(itemId: string): Promise<CartView> {
  return apiFetch<CartView>(`${CART_API_PATH}/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export function emptyCart(): Promise<CartView> {
  return apiFetch<CartView>(CART_API_PATH, { method: "DELETE" });
}
