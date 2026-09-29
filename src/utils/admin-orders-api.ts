/**
 * The admin orders client (design.md C11). Both calls go through apiFetch,
 * so they carry credentials: "same-origin" — the browser's httpOnly
 * petstore_session cookie stands in for the legacy JNLP-embedded session id
 * (SD8) — and any non-2xx response surfaces as the ApiError apiFetch
 * already builds, unchanged.
 */
import { apiFetch } from "./api";
import type {
  OrderApprovalRequest,
  OrderApprovalResponse,
  OrdersByStatus,
} from "@/types/order-approval";

export function fetchOrdersByStatus(): Promise<OrdersByStatus> {
  return apiFetch<{ orders: OrdersByStatus }>("/api/admin/orders").then(
    (response) => response.orders,
  );
}

export function commitOrderDecisions(
  request: OrderApprovalRequest,
): Promise<OrderApprovalResponse> {
  return apiFetch<OrderApprovalResponse>("/api/admin/orders/status", {
    method: "POST",
    body: request,
  });
}
