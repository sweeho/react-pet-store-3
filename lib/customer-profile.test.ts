import { describe, expect, it } from "vitest";

import {
  CARD_TYPES as CLIENT_CARD_TYPES,
  FAVORITE_CATEGORIES as CLIENT_FAVORITE_CATEGORIES,
  LOCALES as CLIENT_LOCALES,
} from "../src/types/customer-profile";
import {
  CARD_TYPES,
  FAVORITE_CATEGORIES,
  LOCALES,
  parseCustomerProfileInput,
  toCustomerProfile,
} from "./customer-profile";
import { ValidationError } from "./errors";

/**
 * UNIT TEST (server project)
 *
 * Exercises toCustomerProfile and parseCustomerProfileInput (design.md
 * C14) as plain functions — no db, no routes.
 */
const account = { id: 1, username: "alice" };

const customerRow = {
  id: 10,
  accountId: 1,
  firstName: "Alice",
  lastName: "Anderson",
  email: "alice@example.com",
  telephone: "555-0100",
  street1: "1 Main St",
  street2: null as string | null,
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "USA",
  locale: "en_US",
  favoriteCategory: "CATS" as string | null,
  myListEnabled: true,
  petTipsEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const cardRow = {
  id: 20,
  customerId: 10,
  cardType: "Visa",
  cardNumber: "4111111111111111",
  expiryMonth: 12,
  expiryYear: 2030,
};

function completeBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const currentYear = new Date().getFullYear();
  return {
    firstName: "Alice",
    lastName: "Anderson",
    email: "alice@example.com",
    telephone: "555-0100",
    address: {
      street1: "1 Main St",
      street2: "Apt 4",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "USA",
    },
    card: {
      cardType: "Visa",
      cardNumber: "4111 1111 1111 1111",
      expiryMonth: 12,
      expiryYear: currentYear + 1,
    },
    preferences: {
      locale: "en_US",
      favoriteCategory: "CATS",
      myListEnabled: true,
      petTipsEnabled: false,
    },
    ...overrides,
  };
}

describe("toCustomerProfile", () => {
  it("never exposes the stored card number, only its last four digits", () => {
    const profile = toCustomerProfile(account, customerRow, cardRow);

    expect(profile.card.cardNumberLast4).toBe("1111");
    expect(JSON.stringify(profile)).not.toContain(cardRow.cardNumber);
  });

  it("maps account, customer and card rows onto the CustomerProfile shape", () => {
    const profile = toCustomerProfile(account, customerRow, cardRow);

    expect(profile).toEqual({
      username: "alice",
      firstName: "Alice",
      lastName: "Anderson",
      email: "alice@example.com",
      telephone: "555-0100",
      address: {
        street1: "1 Main St",
        street2: null,
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "USA",
      },
      card: {
        cardType: "Visa",
        cardNumberLast4: "1111",
        expiryMonth: 12,
        expiryYear: 2030,
      },
      preferences: {
        locale: "en_US",
        favoriteCategory: "CATS",
        myListEnabled: true,
        petTipsEnabled: false,
      },
    });
  });
});

describe("parseCustomerProfileInput", () => {
  it("returns a typed CustomerProfileInput for a complete create body", () => {
    const input = parseCustomerProfileInput(completeBody(), "create");

    expect(input.firstName).toBe("Alice");
    expect(input.card.cardNumber).toBe("4111111111111111");
    expect(input.address.street2).toBe("Apt 4");
    expect(input.preferences.favoriteCategory).toBe("CATS");
  });

  it("treats address.street2 as optional, defaulting to null", () => {
    const body = completeBody();
    const address = body.address as Record<string, unknown>;
    delete address.street2;

    const input = parseCustomerProfileInput(body, "create");

    expect(input.address.street2).toBeNull();
  });

  it("throws ValidationError naming every missing required field by its dotted path", () => {
    try {
      parseCustomerProfileInput({}, "create");
      expect.fail("expected parseCustomerProfileInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      expect(Object.keys(fieldErrors).sort()).toEqual(
        [
          "firstName",
          "lastName",
          "email",
          "telephone",
          "address.street1",
          "address.city",
          "address.state",
          "address.postalCode",
          "address.country",
          "card.cardType",
          "card.cardNumber",
          "card.expiryMonth",
          "card.expiryYear",
          "preferences.locale",
        ].sort(),
      );
    }
  });

  it("rejects an invalid email as a field error on 'email'", () => {
    expect(() =>
      parseCustomerProfileInput(completeBody({ email: "not-an-email" }), "create"),
    ).toThrowError(ValidationError);

    try {
      parseCustomerProfileInput(completeBody({ email: "not-an-email" }), "create");
      expect.fail("expected parseCustomerProfileInput to throw");
    } catch (error) {
      expect((error as ValidationError).fieldErrors.email).toBeDefined();
    }
  });

  it("rejects a card type outside CARD_TYPES as a field error on 'card.cardType'", () => {
    const body = completeBody();
    (body.card as Record<string, unknown>).cardType = "Diners Club";

    try {
      parseCustomerProfileInput(body, "create");
      expect.fail("expected parseCustomerProfileInput to throw");
    } catch (error) {
      expect((error as ValidationError).fieldErrors["card.cardType"]).toBeDefined();
    }
  });

  it("rejects a locale outside LOCALES as a field error on 'preferences.locale'", () => {
    const body = completeBody();
    (body.preferences as Record<string, unknown>).locale = "fr_FR";

    try {
      parseCustomerProfileInput(body, "create");
      expect.fail("expected parseCustomerProfileInput to throw");
    } catch (error) {
      expect((error as ValidationError).fieldErrors["preferences.locale"]).toBeDefined();
    }
  });

  it("rejects an empty card number in create mode as a field error", () => {
    const body = completeBody();
    (body.card as Record<string, unknown>).cardNumber = "";

    try {
      parseCustomerProfileInput(body, "create");
      expect.fail("expected parseCustomerProfileInput to throw");
    } catch (error) {
      expect((error as ValidationError).fieldErrors["card.cardNumber"]).toBeDefined();
    }
  });

  it("accepts an empty card number in update mode, meaning keep the card on file", () => {
    const body = completeBody();
    (body.card as Record<string, unknown>).cardNumber = "";

    const input = parseCustomerProfileInput(body, "update");

    expect(input.card.cardNumber).toBe("");
  });
});

describe("client/server parity (design.md D13)", () => {
  it("mirrors CARD_TYPES, LOCALES and FAVORITE_CATEGORIES in src/types/customer-profile.ts", () => {
    expect(CLIENT_CARD_TYPES).toEqual(CARD_TYPES);
    expect(CLIENT_LOCALES).toEqual(LOCALES);
    expect(CLIENT_FAVORITE_CATEGORIES).toEqual(FAVORITE_CATEGORIES);
  });
});
