export type OrderSortColumn = "id" | "customerName" | "orderDate" | "totalCents" | "status";
export type OrderSortDirection = "asc" | "desc";

export type SortableOrder = {
  id: number;
  customerName: string;
  orderDate: string;
  totalCents: number;
  status: string;
};

export function sortOrders<T extends SortableOrder>(
  rows: readonly T[],
  options: { column: OrderSortColumn; direction: OrderSortDirection },
): T[] {
  void rows;
  void options;
  throw new Error("VortexNotImplemented");
}
