/**
 * Pure client-side sort for the admin orders queue — the stand-in for the
 * legacy TableSorter (design.md D10, SD1). Every column is client-side
 * sortable; ties always break by id ascending, regardless of direction.
 */
export type OrderSortColumn = "id" | "customerName" | "orderDate" | "totalCents" | "status";
export type OrderSortDirection = "asc" | "desc";

export type SortableOrder = {
  id: number;
  customerName: string;
  orderDate: string;
  totalCents: number;
  status: string;
};

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

export function sortOrders<T extends SortableOrder>(
  rows: readonly T[],
  options: { column: OrderSortColumn; direction: OrderSortDirection },
): T[] {
  const { column, direction } = options;
  const factor = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const primary = compare(a[column], b[column]) * factor;
    return primary !== 0 ? primary : a.id - b.id;
  });
}
