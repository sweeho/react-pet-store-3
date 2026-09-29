import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CartLine } from "@/types/cart";
import { CartTable } from "./cart-table";

/**
 * UI TEST. design.md C10: presentational cart table, fully controlled by
 * props; money is integer cents formatted as USD (D6).
 */
const LINES: CartLine[] = [
  {
    itemId: "EST-1",
    productId: "FI-SW-01",
    category: "FISH",
    name: "Angelfish",
    attribute: "Large",
    quantity: 2,
    unitCostCents: 1999,
    totalCostCents: 3998,
  },
  {
    itemId: "EST-2",
    productId: "FI-SW-01",
    category: "FISH",
    name: "Angelfish",
    attribute: "Small",
    quantity: 1,
    unitCostCents: 550,
    totalCostCents: 550,
  },
];

describe("CartTable", () => {
  it("[SWHR3-C-0046] renders one row per line with name, attribute, quantity, unit price and line total", () => {
    render(<CartTable lines={LINES} subtotalCents={4548} onRemove={() => undefined} />);

    const rows = screen.getAllByTestId("cart-line");
    expect(rows).toHaveLength(2);
    const first = within(rows[0]);
    expect(first.getByText("Angelfish")).toBeInTheDocument();
    expect(first.getByText("Large")).toBeInTheDocument();
    expect(first.getByRole("textbox")).toHaveValue("2");
    expect(first.getByText("$19.99")).toBeInTheDocument();
    expect(first.getByText("$39.98")).toBeInTheDocument();
  });

  it("[SWHR3-C-0047] each quantity input is a text input named itemQuantity_<itemId>", () => {
    render(<CartTable lines={LINES} subtotalCents={4548} onRemove={() => undefined} />);

    const input = screen.getByDisplayValue("2");
    expect(input).toHaveAttribute("name", "itemQuantity_EST-1");
    expect(input).toHaveAttribute("type", "text");
  });

  it("[SWHR3-C-0048] every row has a Remove control that reports its itemId", async () => {
    const onRemove = vi.fn();
    render(<CartTable lines={LINES} subtotalCents={4548} onRemove={onRemove} />);

    const buttons = screen.getAllByRole("button", { name: "Remove" });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledExactlyOnceWith("EST-1");
  });

  it("[SWHR3-C-0049] the subtotal row comes last and shows the sum as currency", () => {
    render(<CartTable lines={LINES} subtotalCents={4548} onRemove={() => undefined} />);

    const subtotal = screen.getByTestId("cart-subtotal");
    expect(subtotal).toHaveTextContent("$45.48");
    const rows = screen.getAllByRole("row");
    expect(rows[rows.length - 1]).toBe(subtotal);
  });
});
