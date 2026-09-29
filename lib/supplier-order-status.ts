export const SUPPLIER_ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED"] as const;

export type SupplierOrderStatus = (typeof SUPPLIER_ORDER_STATUSES)[number];

export function assertSupplierOrderTransition(
  poId: number,
  from: SupplierOrderStatus,
  to: SupplierOrderStatus,
): void {
  void poId;
  void from;
  void to;
  throw new Error("VortexNotImplemented");
}
