import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { InventoryRow } from "@/types/supplier";
import { InventoryTable } from "./inventory-table";

/**
 * UI TEST. design.md D7, D8 (supplier-portal-and-inventory): the inventory
 * table names its inputs qty_<itemId> and its checkboxes item_<itemId>, and
 * typing a value ticks the row. Structure follows
 * mockup-supplier-inventory-listing-and-update.html.
 */
const ROWS: InventoryRow[] = [
  { itemId: "EST-1", quantity: 1240 },
  { itemId: "EST-2", quantity: 0 },
];

function renderTable(props: Partial<React.ComponentProps<typeof InventoryTable>> = {}) {
  const onFieldsChange = vi.fn();
  render(
    <InventoryTable rows={ROWS} savedItemIds={[]} onFieldsChange={onFieldsChange} {...props} />,
  );
  return { onFieldsChange };
}

describe("InventoryTable", () => {
  it("[SWHR3-C-0189] each row has an empty, editable text input named qty_<itemId>", async () => {
    renderTable();

    for (const itemId of ["EST-1", "EST-2"]) {
      const input = document.querySelector<HTMLInputElement>(`input[name="qty_${itemId}"]`);
      expect(input).not.toBeNull();
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveValue("");
      expect(input).toBeEnabled();
    }
    const first = document.querySelector<HTMLInputElement>('input[name="qty_EST-1"]');
    await userEvent.type(first as HTMLInputElement, "7");
    expect(first).toHaveValue("7");
  });

  it("[SWHR3-C-0190] each row has a checkbox named item_<itemId>, ticked by typing a value", async () => {
    renderTable();
    const box = (itemId: string) =>
      document.querySelector<HTMLInputElement>(`input[name="item_${itemId}"]`) as HTMLInputElement;
    expect(box("EST-1")).toHaveAttribute("type", "checkbox");
    expect(box("EST-1")).not.toBeChecked();
    expect(box("EST-2")).not.toBeChecked();
    expect(screen.getByText("No items marked for update")).toBeInTheDocument();

    await userEvent.type(
      document.querySelector<HTMLInputElement>('input[name="qty_EST-1"]') as HTMLInputElement,
      "12",
    );

    expect(box("EST-1")).toBeChecked();
    expect(box("EST-2")).not.toBeChecked();
    expect(screen.getByText("1 item marked for update")).toBeInTheDocument();
  });

  it("reports the row fields, and unticking a row reports it unticked", async () => {
    const { onFieldsChange } = renderTable();

    await userEvent.type(
      document.querySelector<HTMLInputElement>('input[name="qty_EST-1"]') as HTMLInputElement,
      "12",
    );
    expect(onFieldsChange).toHaveBeenLastCalledWith({ "qty_EST-1": "12", "item_EST-1": true });

    await userEvent.click(
      document.querySelector<HTMLInputElement>('input[name="item_EST-1"]') as HTMLInputElement,
    );
    expect(onFieldsChange).toHaveBeenLastCalledWith({ "qty_EST-1": "12", "item_EST-1": false });
  });

  it("[SWHR3-C-0193] every row shows the checkbox, item ID, current quantity and new-quantity input", () => {
    renderTable();

    const rows = screen.getAllByTestId("inventory-row");
    expect(rows).toHaveLength(2);
    const cells = within(rows[0]).getAllByRole("cell");
    expect(within(cells[0]).getByRole("checkbox")).toBeInTheDocument();
    expect(cells[1]).toHaveTextContent("EST-1");
    expect(cells[2]).toHaveTextContent("1,240");
    expect(within(cells[3]).getByRole("textbox")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent?.trim())).toEqual(
      ["Update", "Item ID", "Current quantity", "New quantity"],
    );
  });

  it("marks saved rows as updated", () => {
    renderTable({ savedItemIds: ["EST-2"] });

    const rows = screen.getAllByTestId("inventory-row");
    expect(within(rows[1]).getByText("updated")).toBeInTheDocument();
    expect(within(rows[0]).queryByText("updated")).not.toBeInTheDocument();
  });

  it("[SWHR3-C-0194] no items shows an empty-state message and no rows", () => {
    renderTable({ rows: [] });

    expect(screen.getByText("No inventory items to show.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("inventory-row")).toHaveLength(0);
  });

  it("renders the footer action beside the count", () => {
    renderTable({ footerAction: <button type="submit">Update inventory</button> });

    expect(screen.getByRole("button", { name: "Update inventory" })).toBeInTheDocument();
  });
});
