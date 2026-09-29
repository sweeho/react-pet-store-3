/**
 * Client-safe mirror of lib/order-status.ts (design.md D2). The client
 * cannot import from lib/ (the tsconfig split), so the values both sides
 * need are re-declared here; src/constants/order-status.test.ts pins parity.
 */
export const ORDER_STATUSES = ["PENDING", "APPROVED", "DENIED", "COMPLETED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ASSIGNABLE_STATUSES = ["APPROVED", "DENIED"] as const;
export type AssignableStatus = (typeof ASSIGNABLE_STATUSES)[number];
