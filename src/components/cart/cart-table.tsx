/**
 * The presentational cart table (design.md C10, D6). Controlled by props:
 * the page owns the CartView and the form; this renders the lines, the
 * itemQuantity_<itemId> inputs, Remove controls and the subtotal row.
 */
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { CartLine } from "@/types/cart";

export interface CartTableProps {
  lines: CartLine[];
  subtotalCents: number;
  onRemove: (itemId: string) => void;
}

export const QUANTITY_FIELD_PREFIX = "itemQuantity_";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100);
}

export function CartTable({ lines, subtotalCents, onRemove }: CartTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead className="text-right">List Price</TableHead>
          <TableHead className="text-right">Total Cost</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.itemId} data-testid="cart-line">
            <TableCell>{line.name}</TableCell>
            <TableCell>{line.attribute}</TableCell>
            <TableCell>
              <Input
                // Remounts when the server's quantity changes, so an update response resets it.
                key={`${line.itemId}-${line.quantity}`}
                name={`${QUANTITY_FIELD_PREFIX}${line.itemId}`}
                defaultValue={String(line.quantity)}
                maxLength={10}
                inputMode="numeric"
                aria-label={`Quantity for ${line.name} ${line.attribute}`}
                className="w-20"
              />
            </TableCell>
            <TableCell className="text-right">{formatCents(line.unitCostCents)}</TableCell>
            <TableCell className="text-right">{formatCents(line.totalCostCents)}</TableCell>
            <TableCell>
              <Button type="button" variant="link" onClick={() => onRemove(line.itemId)}>
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
        <TableRow data-testid="cart-subtotal">
          <TableCell colSpan={4} className="text-right font-semibold">
            Subtotal
          </TableCell>
          <TableCell className="text-right font-semibold">{formatCents(subtotalCents)}</TableCell>
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
}
