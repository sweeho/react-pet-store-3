import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import type { CartView } from "@/types/cart";
import { getCart } from "@/utils/cart-api";
import Checkout from "./checkout";

/**
 * UI / PAGE TEST. design.md D10/SD9: /checkout is a guard placeholder;
 * order-checkout replaces the populated branch.
 */
vi.mock("@/utils/cart-api", () => ({ getCart: vi.fn() }));

const EMPTY: CartView = { items: [], subtotalCents: 0, count: 0, locale: "en_US" };
const POPULATED: CartView = {
  items: [
    {
      itemId: "EST-1",
      productId: "FI-SW-01",
      category: "FISH",
      name: "Angelfish",
      attribute: "Large",
      quantity: 1,
      unitCostCents: 1650,
      totalCostCents: 1650,
    },
  ],
  subtotalCents: 1650,
  count: 1,
  locale: "en_US",
};

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <Checkout />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("/checkout", () => {
  it("[SWHR3-C-0091] an empty cart shows the error, a link back to /cart and no order entry", async () => {
    vi.mocked(getCart).mockResolvedValue(EMPTY);

    renderCheckout();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(EMPTY_CART_CHECKOUT_MESSAGE);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/cart");
    expect(screen.queryByRole("heading", { name: "Enter Order Information" })).toBeNull();
  });

  it("a populated cart shows the Enter Order Information heading and no error", async () => {
    vi.mocked(getCart).mockResolvedValue(POPULATED);

    renderCheckout();

    expect(
      await screen.findByRole("heading", { name: "Enter Order Information" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows nothing decisive while the cart is loading", async () => {
    vi.mocked(getCart).mockReturnValue(new Promise(() => undefined));

    renderCheckout();

    await waitFor(() => expect(getCart).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Enter Order Information" })).toBeNull();
  });
});
