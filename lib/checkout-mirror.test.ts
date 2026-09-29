import { describe, expect, it } from "vitest";

import * as client from "../src/types/checkout";
import { CONTACT_INFO_FIELDS } from "./contact-info";
import { CHECKOUT_CARD_TYPES } from "./credit-card";

/**
 * UNIT TEST (server project). design.md C10, D13: src/types/checkout.ts is
 * the client mirror of the lib/ checkout values; the client cannot import lib/.
 */
describe("src/types/checkout.ts parity with lib/", () => {
  it("has the same card types in the same order", () => {
    expect([...client.CHECKOUT_CARD_TYPES]).toEqual([...CHECKOUT_CARD_TYPES]);
  });

  it("has the same contact fields in the same order", () => {
    expect(client.CONTACT_INFO_FIELDS).toEqual(CONTACT_INFO_FIELDS);
  });

  it("names the request fields per C4", () => {
    expect(client.BILLING_SUFFIX).toBe("_a");
    expect(client.SHIPPING_SUFFIX).toBe("_b");
    expect(client.CARD_FIELDS).toEqual({
      number: "credit_card_number",
      type: "credit_card_type",
      month: "expiration_month",
      year: "expiration_year",
    });
  });
});
