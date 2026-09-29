import { describe, expect, it } from "vitest";

import { CHECKOUT_CARD_TYPES, createCreditCard, formatExpiry, maskCardNumber } from "./credit-card";

/**
 * UNIT TEST (server project). design.md C3, D6: the checkout CreditCard
 * value object. It does not validate; the request parser does (C6).
 */
describe("credit-card", () => {
  it("[SWHR3-C-0113] formats month and year as MM/YYYY", () => {
    expect(formatExpiry(3, 2025)).toBe("03/2025");
    expect(formatExpiry(12, 2031)).toBe("12/2031");
  });

  it("[SWHR3-C-0136] createCreditCard carries number, type and expiry", () => {
    const card = createCreditCard("4111 1111 1111 4412", "Duke Express", 3, 2029);

    expect(card).toEqual({
      cardNumber: "4111111111114412",
      cardType: "Duke Express",
      expiryDate: "03/2029",
    });
    expect(maskCardNumber(card.cardNumber)).toBe("4412");
  });

  it("maskCardNumber returns the last four digits, ignoring spaces", () => {
    expect(maskCardNumber("4111 1111 1111 4412")).toBe("4412");
  });

  it("CHECKOUT_CARD_TYPES is exactly the three card names, in order", () => {
    expect([...CHECKOUT_CARD_TYPES]).toEqual(["Java Card", "Duke Express", "Meow Card"]);
  });
});
