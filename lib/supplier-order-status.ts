/**
 * The supplier PO lifecycle (design.md D2, C2, supplier-portal-and-
 * inventory): PENDING -> PROCESSING -> COMPLETED, one step forward only.
 */
import { InvalidTransitionError } from "./errors";

export const SUPPLIER_ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED"] as const;

export type SupplierOrderStatus = (typeof SUPPLIER_ORDER_STATUSES)[number];

/**
 * Passes only for PENDING -> PROCESSING and PROCESSING -> COMPLETED. The
 * error's message names an "Order" but the id is the PO's, as in
 * lib/supplier-pos.ts.
 */
export function assertSupplierOrderTransition(
  poId: number,
  from: SupplierOrderStatus,
  to: SupplierOrderStatus,
): void {
  const fromIndex = SUPPLIER_ORDER_STATUSES.indexOf(from);
  if (SUPPLIER_ORDER_STATUSES.indexOf(to) !== fromIndex + 1) {
    throw new InvalidTransitionError(poId, from);
  }
}
