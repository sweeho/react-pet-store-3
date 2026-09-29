/**
 * The supplier inventory table (design.md D7, D8, mockup-supplier-inventory-
 * listing-and-update.html): a checkbox, item ID, current quantity and a
 * new-quantity input per row, named item_<itemId> and qty_<itemId>. It owns
 * the entries: typing a value ticks the row, and every change reports the
 * flat form fields to the page. Rows saved by the last update carry an
 * "updated" marker.
 */
import type { ReactNode } from "react";

import {
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { cn } from "@/utils";
import type { InventoryRow } from "@/types/supplier";

export interface InventoryTableProps {
  rows: InventoryRow[];
  savedItemIds: string[];
  onFieldsChange: (fields: Record<string, string | boolean>) => void;
  footerAction?: ReactNode;
}

const QUANTITY_FORMATTER = new Intl.NumberFormat("en-US");

/** A row with an entered value or a tick is part of the form; the server skips invalid ones (SD7). */
function toFields(
  values: Record<string, string>,
  ticked: Record<string, boolean>,
): Record<string, string | boolean> {
  const fields: Record<string, string | boolean> = {};
  for (const itemId of new Set([...Object.keys(values), ...Object.keys(ticked)])) {
    const value = values[itemId] ?? "";
    const isTicked = ticked[itemId] ?? false;
    if (value !== "" || isTicked) {
      fields[`qty_${itemId}`] = value;
      fields[`item_${itemId}`] = isTicked;
    }
  }
  return fields;
}

export function InventoryTable({
  rows,
  savedItemIds,
  onFieldsChange,
  footerAction,
}: InventoryTableProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [ticked, setTicked] = useState<Record<string, boolean>>({});

  function update(nextValues: Record<string, string>, nextTicked: Record<string, boolean>) {
    setValues(nextValues);
    setTicked(nextTicked);
    onFieldsChange(toFields(nextValues, nextTicked));
  }

  const markedCount = Object.values(ticked).filter(Boolean).length;
  const footerText =
    markedCount === 0
      ? "No items marked for update"
      : `${markedCount} ${markedCount === 1 ? "item" : "items"} marked for update`;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <span className="sr-only">Update</span>
            </TableHead>
            <TableHead>Item ID</TableHead>
            <TableHead className="text-right">Current quantity</TableHead>
            <TableHead className="text-right">New quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isTicked = ticked[row.itemId] ?? false;
            return (
              <TableRow
                key={row.itemId}
                data-testid="inventory-row"
                className={cn(isTicked && "bg-muted/40")}
              >
                <TableCell>
                  <Checkbox
                    name={`item_${row.itemId}`}
                    checked={isTicked}
                    aria-label={`Update ${row.itemId}`}
                    onChange={(event) =>
                      update(values, { ...ticked, [row.itemId]: event.target.checked })
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {row.itemId}
                  {savedItemIds.includes(row.itemId) && (
                    <span className="bg-secondary text-muted-foreground ml-2 rounded-full px-1.5 text-[10px] font-semibold">
                      updated
                    </span>
                  )}
                </TableCell>
                <TableCell className={cn("text-right", row.quantity === 0 && "text-destructive")}>
                  {QUANTITY_FORMATTER.format(row.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    name={`qty_${row.itemId}`}
                    value={values[row.itemId] ?? ""}
                    inputMode="numeric"
                    aria-label={`New quantity for ${row.itemId}`}
                    className="ml-auto w-28 text-right"
                    onChange={(event) => {
                      const value = event.target.value;
                      update(
                        { ...values, [row.itemId]: value },
                        { ...ticked, [row.itemId]: value.trim() !== "" },
                      );
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <p className="text-muted-foreground p-6 text-center text-sm">No inventory items to show.</p>
      )}
      <div className="border-border flex items-center justify-between border-t px-4 py-3">
        <span className="text-muted-foreground text-[13px]">{footerText}</span>
        {footerAction}
      </div>
    </div>
  );
}
