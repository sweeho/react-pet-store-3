import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMPTY_CART_MESSAGE } from "@/constants/cart";
import type { CartLine, CartView } from "@/types/cart";
import { getCart, removeFromCart, updateCart } from "@/utils/cart-api";
import Cart from "./cart";

/**
 * UI / PAGE TEST. design.md D9/C10: the page renders the CartView the
 * server answered, and every response replaces its state.
 */
vi.mock("@/utils/cart-api", () => ({
  getCart: vi.fn(),
  updateCart: vi.fn(),
  removeFromCart: vi.fn(),
}));

function line(itemId: string, attribute: string, quantity: number, unitCostCents = 1650): CartLine {
  return {
    itemId,
    productId: "FI-SW-01",
    category: "FISH",
    name: "Angelfish",
    attribute,
    quantity,
    unitCostCents,
    totalCostCents: quantity * unitCostCents,
  };
}

function view(items: CartLine[]): CartView {
  return {
    items,
    subtotalCents: items.reduce((sum, i) => sum + i.totalCostCents, 0),
    count: items.length,
    locale: "en_US",
  };
}

const EMPTY = view([]);

function renderCart() {
  return render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<p>checkout page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("/cart", () => {
  it("[SWHR3-C-0043] an empty cart shows the empty message and no table", async () => {
    vi.mocked(getCart).mockResolvedValue(EMPTY);
    renderCart();

    expect(await screen.findByText(EMPTY_CART_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Cart" })).not.toBeInTheDocument();
  });

  it("[SWHR3-C-0044] removing the last item switches to the empty state", async () => {
    vi.mocked(getCart).mockResolvedValue(view([line("EST-1", "Large", 1)]));
    vi.mocked(removeFromCart).mockResolvedValue(EMPTY);
    renderCart();

    await userEvent.click(await screen.findByRole("button", { name: "Remove" }));

    expect(await screen.findByText(EMPTY_CART_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[SWHR3-C-0046] renders one row per item with name, attribute, quantity, unit price and line total", async () => {
    vi.mocked(getCart).mockResolvedValue(
      view([line("EST-1", "Large", 2), line("EST-2", "Small", 1)]),
    );
    renderCart();

    const rows = await screen.findAllByTestId("cart-line");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Large");
    expect(rows[0]).toHaveTextContent("$16.50");
    expect(rows[0]).toHaveTextContent("$33.00");
    expect(rows[1]).toHaveTextContent("Small");
    expect(rows[1]).toHaveTextContent("$16.50");
  });

  it("[SWHR3-C-0047] each row has an editable text input named itemQuantity_<itemId>", async () => {
    vi.mocked(getCart).mockResolvedValue(view([line("EST-1", "Large", 3)]));
    renderCart();

    const input = await screen.findByDisplayValue("3");
    expect(input).toHaveAttribute("name", "itemQuantity_EST-1");
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    expect(input).toHaveValue("5");
  });

  it("[SWHR3-C-0048] Remove deletes that item and the row goes away", async () => {
    vi.mocked(getCart).mockResolvedValue(
      view([line("EST-1", "Large", 1), line("EST-2", "Small", 1)]),
    );
    vi.mocked(removeFromCart).mockResolvedValue(view([line("EST-2", "Small", 1)]));
    renderCart();

    const buttons = await screen.findAllByRole("button", { name: "Remove" });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);

    await waitFor(() => expect(screen.getAllByTestId("cart-line")).toHaveLength(1));
    expect(removeFromCart).toHaveBeenCalledExactlyOnceWith("EST-1");
    expect(screen.getByTestId("cart-line")).toHaveTextContent("Small");
  });

  it("[SWHR3-C-0049] the subtotal row shows the sum of line totals as currency", async () => {
    vi.mocked(getCart).mockResolvedValue(
      view([line("EST-1", "Large", 2, 1999), line("EST-2", "Small", 1, 550)]),
    );
    renderCart();

    expect(await screen.findByTestId("cart-subtotal")).toHaveTextContent("$45.48");
  });

  it("[SWHR3-C-0050] Update Cart sends every itemQuantity_ field in one PUT", async () => {
    vi.mocked(getCart).mockResolvedValue(
      view([line("EST-1", "Large", 1), line("EST-2", "Small", 2)]),
    );
    vi.mocked(updateCart).mockResolvedValue(
      view([line("EST-1", "Large", 4), line("EST-2", "Small", 2)]),
    );
    renderCart();

    const input = await screen.findByDisplayValue("1");
    await userEvent.clear(input);
    await userEvent.type(input, "4");
    await userEvent.click(screen.getByRole("button", { name: "Update Cart" }));

    await waitFor(() => expect(screen.getByDisplayValue("4")).toBeInTheDocument());
    expect(updateCart).toHaveBeenCalledExactlyOnceWith({
      "itemQuantity_EST-1": "4",
      "itemQuantity_EST-2": "2",
    });
  });

  it("[SWHR3-C-0052] the Check Out link points to /checkout", async () => {
    vi.mocked(getCart).mockResolvedValue(view([line("EST-1", "Large", 1)]));
    renderCart();

    const link = await screen.findByRole("link", { name: "Check Out" });
    expect(link).toHaveAttribute("href", "/checkout");
    await userEvent.click(link);
    expect(await screen.findByText("checkout page")).toBeInTheDocument();
  });

  it("shows an error when the cart cannot be loaded", async () => {
    vi.mocked(getCart).mockRejectedValue(new Error("boom"));
    renderCart();

    expect(await screen.findByText("Your cart could not be loaded.")).toBeInTheDocument();
  });
});
