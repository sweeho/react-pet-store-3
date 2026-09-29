import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PaymentFields } from "./payment-fields";

/**
 * UI / COMPONENT TEST. design.md C4, D6: the "3 Payment" section of the
 * checkout form.
 */
const optionTexts = (select: HTMLElement) =>
  within(select)
    .getAllByRole("option")
    .map((o) => o.textContent);

describe("PaymentFields", () => {
  it("[SWHR3-C-0110] has card number, type, month and year controls with C4 names", () => {
    const year = new Date().getFullYear();
    render(<PaymentFields />);

    expect(screen.getByRole("heading", { name: /payment/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Card number")).toHaveAttribute("name", "credit_card_number");
    expect(screen.getByLabelText("Card type")).toHaveAttribute("name", "credit_card_type");
    const month = screen.getByLabelText("Expiry month");
    expect(month).toHaveAttribute("name", "expiration_month");
    expect(optionTexts(month)).toEqual(
      Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
    const yearSelect = screen.getByLabelText("Expiry year");
    expect(yearSelect).toHaveAttribute("name", "expiration_year");
    expect(optionTexts(yearSelect)).toEqual(Array.from({ length: 6 }, (_, i) => String(year + i)));
  });

  it("[SWHR3-C-0111] card type offers exactly Java Card, Duke Express and Meow Card", () => {
    render(<PaymentFields />);

    expect(optionTexts(screen.getByLabelText("Card type"))).toEqual([
      "Java Card",
      "Duke Express",
      "Meow Card",
    ]);
  });

  it("[SWHR3-C-0110] shows an inline error beside its field", () => {
    render(<PaymentFields errors={{ credit_card_number: "Enter a card number." }} />);

    expect(screen.getByLabelText("Card number")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a card number.")).toBeInTheDocument();
  });
});
