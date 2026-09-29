import type { AssignableStatus } from "@/constants/order-status";
import type { OrderRow } from "@/types/order-approval";
import type { OrderSortColumn, OrderSortDirection } from "@/utils/sort-orders";

export interface OrdersTableSort {
  column: OrderSortColumn;
  direction: OrderSortDirection;
}

export interface OrdersTableProps {
  rows: OrderRow[];
  editable: boolean;
  staged: ReadonlyMap<number, AssignableStatus>;
  selectedIds: readonly number[];
  onSelectionChange: (ids: number[]) => void;
  onStage: (ids: number[], status: AssignableStatus) => void;
  sort: OrdersTableSort;
  onSortChange: (sort: OrdersTableSort) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- red-phase stub
export function OrdersTable(props: OrdersTableProps): unknown {
  throw new Error("VortexNotImplemented");
}
