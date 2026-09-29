/**
 * The presentational order queue (design.md D10, C12). Fully controlled by
 * props: selection, staged decisions and sort all live with the caller
 * (the admin orders page, wired through useStagedDecisions and
 * src/utils/sort-orders.ts) — this component renders them and reports
 * intent back through callbacks. Columns and copy follow the pending-queue
 * mockup (artifacts/SWHR3-S-0003/design/mockup-order-review-pending-queue-
 * with-staged-d.html) and its read-only counterpart
 * (mockup-decided-orders-queue-read-only.html).
 */
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  Badge,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { ASSIGNABLE_STATUSES } from "@/constants/order-status";
import type { AssignableStatus } from "@/constants/order-status";
import type { OrderRow } from "@/types/order-approval";
import type { OrderSortColumn, OrderSortDirection } from "@/utils/sort-orders";
import { cn } from "@/utils";

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

const COLUMNS: ReadonlyArray<{ key: OrderSortColumn; label: string; align?: "right" }> = [
  { key: "id", label: "Order" },
  { key: "customerName", label: "Customer" },
  { key: "orderDate", label: "Date" },
  { key: "totalCents", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
];

const STATUS_BADGE_VARIANT: Record<OrderRow["status"], Exclude<BadgeVariant, "staged">> = {
  PENDING: "pending",
  APPROVED: "approved",
  DENIED: "denied",
  COMPLETED: "completed",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatAmount(totalCents: number): string {
  return AMOUNT_FORMATTER.format(totalCents / 100);
}

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const day = date.getUTCDate();
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function OrdersTable({
  rows,
  editable,
  staged,
  selectedIds,
  onSelectionChange,
  onStage,
  sort,
  onSortChange,
}: OrdersTableProps) {
  const selected = new Set(selectedIds);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  function toggleRow(id: number) {
    onSelectionChange(
      selected.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  function toggleAll() {
    onSelectionChange(allSelected ? [] : rows.map((row) => row.id));
  }

  function stageSelected(status: AssignableStatus) {
    if (selectedIds.length === 0) {
      return;
    }
    onStage([...selectedIds], status);
    onSelectionChange([]);
  }

  function ariaSortFor(column: OrderSortColumn): "ascending" | "descending" | "none" {
    if (sort.column !== column) {
      return "none";
    }
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  function handleSortClick(column: OrderSortColumn) {
    onSortChange({
      column,
      direction: sort.column === column && sort.direction === "asc" ? "desc" : "asc",
    });
  }

  return (
    <div>
      {editable && (
        <div className="border-border flex items-center gap-3 border-b px-1 py-3">
          <span className="text-muted-foreground text-sm">
            <b className="text-foreground font-semibold">{selectedIds.length}</b> of {rows.length}{" "}
            selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => stageSelected("APPROVED")}
          >
            Approve selected
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => stageSelected("DENIED")}>
            Deny selected
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {editable && (
              <TableHead className="w-[52px]">
                <Checkbox
                  aria-label="Select all orders"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableHead>
            )}
            {COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                aria-sort={ariaSortFor(column.key)}
                className={column.align === "right" ? "text-right" : undefined}
              >
                <button
                  type="button"
                  className="text-foreground inline-flex items-center gap-1 font-semibold"
                  onClick={() => handleSortClick(column.key)}
                >
                  {column.label}
                  {ariaSortFor(column.key) === "ascending" ? (
                    <ChevronUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  )}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const stagedStatus = staged.get(row.id);
            return (
              <TableRow key={row.id}>
                {editable && (
                  <TableCell>
                    <Checkbox
                      aria-label={`Select order ${row.id}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-semibold">{row.id}</TableCell>
                <TableCell className="font-medium">{row.customerName}</TableCell>
                <TableCell className="text-muted-foreground text-[13.5px]">
                  {formatOrderDate(row.orderDate)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatAmount(row.totalCents)}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Status for order ${row.id}`}
                        className={cn(
                          "border-input bg-background h-9 rounded-md border px-2 text-sm",
                          stagedStatus && "border-foreground border-dashed",
                        )}
                        value={stagedStatus ?? ""}
                        onChange={(event) =>
                          onStage([row.id], event.target.value as AssignableStatus)
                        }
                      >
                        <option value="" disabled hidden>
                          Set status…
                        </option>
                        {ASSIGNABLE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {stagedStatus && (
                        <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                          Staged
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{row.status}</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
