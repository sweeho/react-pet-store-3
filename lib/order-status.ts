/**
 * The order status vocabulary and its only legal administrator transitions
 * (design.md D2, interface contract C2). src/constants/order-status.ts
 * mirrors ORDER_STATUSES and ASSIGNABLE_STATUSES for the client; the
 * parity test holds the two equal.
 */
import { InvalidTransitionError } from "./errors";

export const ORDER_STATUSES = ["PENDING", "APPROVED", "DENIED", "COMPLETED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ASSIGNABLE_STATUSES = ["APPROVED", "DENIED"] as const;
export type AssignableStatus = (typeof ASSIGNABLE_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isAssignableStatus(value: unknown): value is AssignableStatus {
  return typeof value === "string" && (ASSIGNABLE_STATUSES as readonly string[]).includes(value);
}

// The only legal administrator transitions (D2). Every other pair,
// including a no-op (from === to), is invalid.
const LEGAL_TRANSITIONS = new Set<string>(["PENDING->APPROVED", "PENDING->DENIED"]);

export function assertTransition(orderId: number, from: OrderStatus, to: OrderStatus): void {
  if (!LEGAL_TRANSITIONS.has(`${from}->${to}`)) {
    throw new InvalidTransitionError(orderId, from);
  }
}
