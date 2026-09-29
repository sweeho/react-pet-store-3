/**
 * Client types for the order-approval capability (design.md C9), matching
 * the server contracts C3–C6 (lib/orders.ts, lib/order-approval.ts,
 * lib/order-approval-request.ts, the admin order routes). The request body
 * is JSON, not XML — the legacy spec's XML wording is translated by SD2.
 */
import type { AssignableStatus, OrderStatus } from "@/constants/order-status";

export interface OrderRow {
  id: number;
  customerName: string;
  orderDate: string;
  totalCents: number;
  status: OrderStatus;
}

export type OrdersByStatus = Record<OrderStatus, OrderRow[]>;

export interface ChangedOrder {
  orderId: number;
  status: AssignableStatus;
}

export interface OrderApprovalRequest {
  requestType: "UPDATESTATUS";
  changes: ChangedOrder[];
}

export interface OrderApprovalResponse {
  type: "UPDATEORDERS";
  status: "SUCCESS";
  updated: number;
}
