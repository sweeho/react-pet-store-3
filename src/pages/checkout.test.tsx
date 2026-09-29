import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import type { CartView } from "@/types/cart";
import { ApiError, apiFetch } from "@/utils/api";
import { getCart } from "@/utils/cart-api";
import { placeOrder } from "@/utils/orders-api";
import Checkout from "./checkout";

/**
 * UI / PAGE TEST. design.md D10, D13, SD8: /checkout is the three-section
 * order form for a non-empty cart. Built from
 * mockup-checkout-enter-order-information.html (main content only, SD12).
 */
vi.mock("@/utils/cart-api", () => ({ getCart: vi.fn() }));
vi.mock("@/utils/orders-api", () => ({ placeOrder: vi.fn() }));
vi.mock("@/utils/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/api")>()),
  apiFetch: vi.fn(),
}));

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
    {
      itemId: "EST-2",
      productId: "K9-BD-01",
      category: "DOGS",
      name: "Bulldog",
      attribute: "Adult",
      quantity: 2,
      unitCostCents: 1850,
      totalCostCents: 3700,
    },
  ],
  subtotalCents: 5350,
  count: 2,
  locale: "en_US",
};
const PROFILE = {
  customer: {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@example.com",
    telephone: "+1 650 555 0134",
    address: {
      street1: "1247 Larkspur Avenue",
      street2: "Apt 3B",
      city: "Palo Alto",
      state: "CA",
      postalCode: "94301",
      country: "United States",
    },
  },
};

function mockLoad(profile: "ok" | "none" = "ok", cart: CartView = POPULATED) {
  vi.mocked(getCart).mockResolvedValue(cart);
  vi.mocked(apiFetch).mockImplementation((path: string) =>
    profile === "ok" && path === "/api/customers/me"
      ? Promise.resolve(PROFILE)
      : Promise.reject(new ApiError({ status: 404, message: "Not found" })),
  );
}

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:id" element={<p>Confirmation screen</p>} />
        <Route path="/cart" element={<p>Cart screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function findForm() {
  await screen.findByRole("heading", { name: "Billing address" });
}

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("/checkout guards", () => {
  it("[SWHR3-C-0091] an empty cart shows the error, a link back to /cart and no order entry", async () => {
    mockLoad("ok", EMPTY);

    renderCheckout();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(EMPTY_CART_CHECKOUT_MESSAGE);
    expect(
      screen.getByRole("heading", { name: "Your shopping cart is empty" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Back to shopping cart" })).toHaveAttribute(
      "href",
      "/cart",
    );
    expect(screen.queryByRole("heading", { name: "Enter Order Information" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Billing address" })).toBeNull();
  });

  it("shows nothing decisive while the cart is loading", async () => {
    vi.mocked(getCart).mockReturnValue(new Promise(() => undefined));
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => undefined));

    renderCheckout();

    await waitFor(() => expect(getCart).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Billing address" })).toBeNull();
  });

  it("shows a load-failure alert when the cart cannot be loaded", async () => {
    vi.mocked(getCart).mockRejectedValue(new ApiError({ status: 500, message: "boom" }));
    vi.mocked(apiFetch).mockRejectedValue(new ApiError({ status: 404, message: "no" }));

    renderCheckout();

    expect(await screen.findByRole("alert")).toHaveTextContent("Your cart could not be loaded.");
  });
});

describe("/checkout form", () => {
  it("[SWHR3-C-0143] shows billing, shipping and payment sections with the order summary", async () => {
    mockLoad();

    renderCheckout();
    await findForm();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(headings.indexOf("Billing address"))).toEqual([
      "Billing address",
      "Shipping address",
      "Payment",
      "Order summary",
    ]);
    expect(screen.getByRole("heading", { name: "Checkout", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enter Order Information" })).toBeInTheDocument();
    expect(screen.getByLabelText("Card type")).toBeInTheDocument();
    expect(screen.getByLabelText("Card number")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiry month")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiry year")).toBeInTheDocument();

    const summary = within(screen.getByRole("complementary"));
    expect(summary.getByText("Angelfish")).toBeInTheDocument();
    expect(summary.getByText("Bulldog")).toBeInTheDocument();
    expect(summary.getByText(/EST-2 · \$18\.50 × 2/)).toBeInTheDocument();
    expect(summary.getByText("$53.50")).toBeInTheDocument();
    expect(summary.getByRole("link", { name: "Edit cart" })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("button", { name: "Place order" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to shopping cart" })).toHaveAttribute(
      "href",
      "/cart",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("[SWHR3-C-0099] the billing section offers every address field, named with _a", async () => {
    mockLoad("none");

    renderCheckout();
    await findForm();

    const billing = section("Billing address");
    const expected: Array<[RegExp, string]> = [
      [/^Given name/, "given_name_a"],
      [/^Family name/, "family_name_a"],
      [/^Address line 1/, "address_1_a"],
      [/^Address line 2/, "address_2_a"],
      [/^City/, "city_a"],
      [/^State or province/, "state_or_province_a"],
      [/^Postal code/, "postal_code_a"],
      [/^Country/, "country_a"],
      [/^Telephone/, "telephone_number_a"],
      [/^Email/, "email_a"],
    ];
    for (const [label, name] of expected) {
      expect(billing.getByLabelText(label)).toHaveAttribute("name", name);
    }
    expect(billing.getByText("Optional")).toBeInTheDocument();
    expect(billing.getByLabelText(/^City/)).toHaveValue("");
  });

  it("pre-fills billing from the profile and leaves shipping blank", async () => {
    mockLoad();

    renderCheckout();
    await findForm();

    const billing = section("Billing address");
    expect(billing.getByLabelText(/^Given name/)).toHaveValue("Sarah");
    expect(billing.getByLabelText(/^Family name/)).toHaveValue("Chen");
    expect(billing.getByLabelText(/^Address line 1/)).toHaveValue("1247 Larkspur Avenue");
    expect(billing.getByLabelText(/^Address line 2/)).toHaveValue("Apt 3B");
    expect(billing.getByLabelText(/^State or province/)).toHaveValue("CA");
    expect(billing.getByLabelText(/^Email/)).toHaveValue("sarah.chen@example.com");
    expect(billing.getByText("Pre-filled from your account")).toBeInTheDocument();
    expect(section("Shipping address").getByLabelText(/^City/)).toHaveValue("");
    expect(screen.getByLabelText("Card number")).toHaveValue("");
  });

  it("[SWHR3-C-0105] the shipping section is editable on its own", async () => {
    mockLoad();

    renderCheckout();
    await findForm();

    const shipping = section("Shipping address");
    expect(shipping.getByLabelText(/^Address line 1/)).toHaveAttribute("name", "address_1_b");
    expect(shipping.getByLabelText(/^Address line 1/)).toHaveValue("");
    await userEvent.type(shipping.getByLabelText(/^Address line 1/), "88 Market Street");

    expect(shipping.getByLabelText(/^Address line 1/)).toHaveValue("88 Market Street");
    expect(section("Billing address").getByLabelText(/^Address line 1/)).toHaveValue(
      "1247 Larkspur Avenue",
    );
  });

  it("the form does not use browser validation, so the server reports every field (D13)", async () => {
    mockLoad();

    const { container } = renderCheckout();
    await findForm();

    expect(container.querySelector("form")).toHaveAttribute("novalidate");
  });
});

describe("/checkout submit", () => {
  async function fillPayment() {
    await userEvent.type(screen.getByLabelText("Card number"), "4111 1111 1111 4412");
  }

  it("[SWHR3-C-0107] Same as billing address copies billing into shipping and disables it", async () => {
    mockLoad();
    vi.mocked(placeOrder).mockResolvedValue({
      orderId: 42,
      orderDate: "2026-01-01T00:00:00.000Z",
      email: "sarah.chen@example.com",
    });

    renderCheckout();
    await findForm();
    await userEvent.click(screen.getByLabelText("Same as billing address"));

    for (const input of section("Shipping address").getAllByRole("textbox")) {
      expect(input).toBeDisabled();
    }
    expect(section("Shipping address").getByLabelText(/^City/)).toHaveValue("Palo Alto");

    await fillPayment();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => expect(placeOrder).toHaveBeenCalledTimes(1));
    const fields = vi.mocked(placeOrder).mock.calls[0][0];
    const params = [
      "family_name",
      "given_name",
      "address_1",
      "address_2",
      "city",
      "state_or_province",
      "postal_code",
      "country",
      "telephone_number",
      "email",
    ];
    for (const param of params) {
      expect(fields[`${param}_b`]).toBe(fields[`${param}_a`]);
    }
    expect(fields.city_b).toBe("Palo Alto");
  });

  it("sends every C4 field name and navigates to the confirmation on success", async () => {
    mockLoad();
    vi.mocked(placeOrder).mockResolvedValue({
      orderId: 42,
      orderDate: "2026-01-01T00:00:00.000Z",
      email: "sarah.chen@example.com",
    });

    renderCheckout();
    await findForm();
    const shipping = section("Shipping address");
    await userEvent.type(shipping.getByLabelText(/^Given name/), "Alex");
    await userEvent.type(shipping.getByLabelText(/^Family name/), "Chen");
    await userEvent.type(shipping.getByLabelText(/^Address line 1/), "88 Market Street");
    await userEvent.type(shipping.getByLabelText(/^City/), "San Francisco");
    await userEvent.type(shipping.getByLabelText(/^State or province/), "CA");
    await userEvent.type(shipping.getByLabelText(/^Postal code/), "94103");
    await userEvent.type(shipping.getByLabelText(/^Country/), "United States");
    await userEvent.type(shipping.getByLabelText(/^Telephone/), "+1 415 555 0177");
    await userEvent.type(shipping.getByLabelText(/^Email/), "alex@example.com");
    await fillPayment();
    await userEvent.selectOptions(screen.getByLabelText("Card type"), "Meow Card");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Confirmation screen")).toBeInTheDocument();
    const fields = vi.mocked(placeOrder).mock.calls[0][0];
    expect(fields).toMatchObject({
      given_name_a: "Sarah",
      city_a: "Palo Alto",
      email_a: "sarah.chen@example.com",
      given_name_b: "Alex",
      city_b: "San Francisco",
      email_b: "alex@example.com",
      credit_card_number: "4111 1111 1111 4412",
      credit_card_type: "Meow Card",
    });
    for (const name of [
      "family_name_a",
      "address_1_a",
      "address_2_a",
      "state_or_province_a",
      "postal_code_a",
      "country_a",
      "telephone_number_a",
      "address_2_b",
      "expiration_month",
      "expiration_year",
    ]) {
      expect(fields).toHaveProperty(name);
    }
  });

  it("shows a generic alert and stays on the page when the order fails", async () => {
    mockLoad();
    vi.mocked(placeOrder).mockRejectedValue(new ApiError({ status: 500, message: "boom" }));

    renderCheckout();
    await findForm();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your order could not be placed");
    expect(screen.queryByText("Confirmation screen")).toBeNull();
  });
});

describe("/checkout refused orders", () => {
  it("[SWHR3-C-0102] lists missing billing fields, shows inline errors and keeps typed values", async () => {
    mockLoad("none");
    vi.mocked(placeOrder).mockRejectedValue(
      new ApiError({
        status: 422,
        message: "Validation failed",
        code: "VALIDATION_FAILED",
        fieldErrors: { city_a: "Enter a city.", postal_code_a: "Spaces only — enter a code." },
        missingFields: ["city_a", "postal_code_a"],
      }),
    );

    renderCheckout();
    await findForm();
    await userEvent.type(section("Billing address").getByLabelText(/^Given name/), "Sarah");
    await userEvent.type(screen.getByLabelText("Card number"), "4111 1111 1111 4412");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Your order was not placed — 2 required fields are missing");
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Billing · City", "Billing · Postal code"]);
    const billing = section("Billing address");
    expect(billing.getByLabelText(/^City/)).toHaveAccessibleDescription("Enter a city.");
    expect(billing.getByLabelText(/^Postal code/)).toHaveAccessibleDescription(
      "Spaces only — enter a code.",
    );
    expect(billing.getByLabelText(/^Given name/)).toHaveValue("Sarah");
    expect(screen.getByLabelText("Card number")).toHaveValue("4111 1111 1111 4412");
    expect(alert).toHaveFocus();
  });

  it("shows a payment field error beside the payment field", async () => {
    mockLoad("none");
    vi.mocked(placeOrder).mockRejectedValue(
      new ApiError({
        status: 422,
        message: "Validation failed",
        code: "VALIDATION_FAILED",
        fieldErrors: { credit_card_number: "Enter a card number." },
        missingFields: ["credit_card_number"],
      }),
    );

    renderCheckout();
    await findForm();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Card number")).toHaveAccessibleDescription(
      "Enter a card number.",
    );
  });

  it("[SWHR3-C-0117] replaces the form with the empty-cart state on a 409", async () => {
    mockLoad();
    vi.mocked(placeOrder).mockRejectedValue(
      new ApiError({
        status: 409,
        message: "Shopping cart is empty",
        code: "SHOPPING_CART_EMPTY",
      }),
    );

    renderCheckout();
    await findForm();
    await userEvent.type(screen.getByLabelText("Card number"), "4111 1111 1111 4412");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(
      await screen.findByRole("heading", { name: "Your shopping cart is empty" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(EMPTY_CART_CHECKOUT_MESSAGE);
    expect(screen.getByRole("link", { name: "Continue shopping" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to shopping cart" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Billing address" })).toBeNull();
    expect(screen.queryByText("Confirmation screen")).toBeNull();
  });

  it("any other error shows a generic alert, logs it and keeps the form", async () => {
    mockLoad();
    const error = new ApiError({ status: 500, message: "boom" });
    vi.mocked(placeOrder).mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderCheckout();
    await findForm();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your order could not be placed");
    expect(screen.getByRole("heading", { name: "Billing address" })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it("clears the summary when the order is resubmitted", async () => {
    mockLoad("none");
    vi.mocked(placeOrder)
      .mockRejectedValueOnce(
        new ApiError({
          status: 422,
          message: "Validation failed",
          code: "VALIDATION_FAILED",
          fieldErrors: { city_a: "Enter a city." },
          missingFields: ["city_a"],
        }),
      )
      .mockReturnValueOnce(new Promise(() => undefined));

    renderCheckout();
    await findForm();
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
