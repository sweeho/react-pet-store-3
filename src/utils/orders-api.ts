/**
 * The orders client (design.md C9, C10). Both calls go through apiFetch, so a
 * 422 surfaces as the ApiError carrying the server's fieldErrors.
 */
import type { OrderConfirmation, PlacedOrder } from "@/types/checkout";
import { apiFetch } from "./api";

/** `fields` is the checkout form's flat FormData: `<param>_a`, `<param>_b` and the card fields. */
export function placeOrder(fields: Record<string, string>): Promise<PlacedOrder> {
  return apiFetch<PlacedOrder>("/api/orders", { method: "POST", body: fields });
}

export function getOrder(id: number): Promise<OrderConfirmation> {
  return apiFetch<OrderConfirmation>(`/api/orders/${id}`);
}
