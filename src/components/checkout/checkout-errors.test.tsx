import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import { CheckoutErrors, EmptyCartState, checkoutFieldLabel } from "./checkout-errors";

/**
 * UI / COMPONENT TEST. Builds mockup-checkout-missing-required-fields.html's
 * summary banner and mockup-checkout-blocked-shopping-cart-is-empty.html
 * (main content only, SD12).
 */
describe("checkoutFieldLabel", () => {
  it.each([
    ["city_a", "Billing · City"],
    ["postal_code_a", "Billing · Postal code"],
    ["telephone_number_b", "Shipping · Telephone"],
    ["address_1_b", "Shipping · Address line 1"],
    ["credit_card_number", "Payment · Card number"],
    ["credit_card_type", "Payment · Card type"],
    ["expiration_month", "Payment · Expiry month"],
    ["expiration_year", "Payment · Expiry year"],
  ])("labels %s as %s", (param, label) => {
    expect(checkoutFieldLabel(param)).toBe(label);
  });

  it("falls back to the raw name for an unknown field", () => {
    expect(checkoutFieldLabel("mystery")).toBe("mystery");
  });
});

describe("CheckoutErrors", () => {
  it("summarises every missing field with its section and label", () => {
    render(
      <CheckoutErrors
        missingFields={["city_a", "postal_code_a", "telephone_number_b", "credit_card_number"]}
        fieldErrors={{}}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Your order was not placed — 4 required fields are missing");
    expect(alert).toHaveTextContent(
      "Fill in the fields listed below, then choose Place order again.",
    );
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "Billing · City",
      "Billing · Postal code",
      "Shipping · Telephone",
      "Payment · Card number",
    ]);
  });

  it("uses the singular for one missing field", () => {
    render(<CheckoutErrors missingFields={["city_a"]} fieldErrors={{}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your order was not placed — 1 required field is missing",
    );
  });

  it("lists a field that is present but invalid after the missing ones", () => {
    render(
      <CheckoutErrors
        missingFields={["city_a"]}
        fieldErrors={{ city_a: "Enter a city.", expiration_year: "Choose a year." }}
      />,
    );

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Billing · City",
      "Payment · Expiry year",
    ]);
  });

  it("with only invalid fields, says some fields need correcting", () => {
    render(<CheckoutErrors missingFields={[]} fieldErrors={{ email_a: "Enter a valid email." }} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your order was not placed — some fields need correcting",
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Billing · Email");
  });

  it("can receive focus programmatically", () => {
    render(<CheckoutErrors missingFields={["city_a"]} fieldErrors={{}} />);

    expect(screen.getByRole("alert")).toHaveAttribute("tabindex", "-1");
  });
});

describe("EmptyCartState", () => {
  it("shows the empty-cart heading, the spec-of-record message and both links", () => {
    render(
      <MemoryRouter>
        <EmptyCartState />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Your shopping cart is empty" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(EMPTY_CART_CHECKOUT_MESSAGE);
    expect(
      screen.getByText(/no order was created and nothing has been charged/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Back to shopping cart" })).toHaveAttribute(
      "href",
      "/cart",
    );
  });
});
