import { randomUUID } from "node:crypto";
import { count } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  notificationOutbox,
  orders,
  paymentAuthorizations,
} from "../db/schema";
import authMiddleware from "../middleware/auth";
import cartSession from "../middleware/cart-session";
import postOrder from "../routes/api/orders/index.post";
import { AUTH_CONFIG } from "./auth-config";
import { getDetails } from "./cart";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { ShoppingCartEmptyError } from "./errors";
import { processOrder } from "./order-processing";
import { startSession } from "./session";

/**
 * UNIT / INTEGRATION TEST (server project). SD9 (order-processing-and-
 * fulfilment): processOrder and POST /api/orders refuse an order before
 * anything is written when the cart is empty, the caller is signed out, or
 * the checkout data is incomplete. No production file changes for this.
 */
const BILL_TO: ContactInfo = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1 Main St",
  address2: null,
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "USA",
  telephoneNumber: "555-0100",
  email: "sarah.chen@example.com",
};
const EVENT = {
  shipper: BILL_TO,
  receiver: { ...BILL_TO, city: "San Francisco" },
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};
const YEAR = new Date().getFullYear();

let accountId: number;
let sessionCookie: string;

beforeAll(async () => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-validation-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  const started = new H3Event(new Request("http://localhost/api/orders"));
  await startSession(started, { id: accountId, username: "order-validation-user" });
  sessionCookie = (
    started.res.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`)) ?? ""
  ).split(";")[0];
  db.insert(catalogItems)
    .values({ itemId: "VAL-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values({ itemId: "VAL-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function counts() {
  return {
    orders: db.select({ n: count() }).from(orders).get()?.n ?? 0,
    payments: db.select({ n: count() }).from(paymentAuthorizations).get()?.n ?? 0,
    outbox: db.select({ n: count() }).from(notificationOutbox).get()?.n ?? 0,
  };
}

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems).values({ sessionToken: token, itemId: "VAL-1", quantity: 1 }).run();
  return token;
}

function fields(overrides: Record<string, string> = {}): Record<string, string> {
  const address = (suffix: "_a" | "_b", city: string) => ({
    [`family_name${suffix}`]: "Chen",
    [`given_name${suffix}`]: "Sarah",
    [`address_1${suffix}`]: "1 Main St",
    [`address_2${suffix}`]: "",
    [`city${suffix}`]: city,
    [`state_or_province${suffix}`]: "CA",
    [`postal_code${suffix}`]: "94301",
    [`country${suffix}`]: "United States",
    [`telephone_number${suffix}`]: "555-0100",
    [`email${suffix}`]: "sarah.chen@example.com",
  });
  return {
    ...address("_a", "Palo Alto"),
    ...address("_b", "San Francisco"),
    credit_card_number: "4111 1111 1111 4412",
    credit_card_type: "Java Card",
    expiration_month: "03",
    expiration_year: String(YEAR + 2),
    ...overrides,
  };
}

async function post(
  payload: Record<string, string>,
  options: { cartToken?: string; signedIn?: boolean } = {},
): Promise<unknown> {
  const { cartToken, signedIn = true } = options;
  const cookies = [signedIn ? sessionCookie : "", cartToken ? `petstore_cart=${cartToken}` : ""]
    .filter(Boolean)
    .join("; ");
  const event = new H3Event(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookies ? { cookie: cookies } : {}) },
      body: JSON.stringify(payload),
    }),
  );
  await authMiddleware(event);
  await cartSession(event);
  return postOrder(event);
}

describe("processOrder preconditions", () => {
  it("[SWHR3-C-0158] an empty or unknown cart is refused before anything is written", () => {
    const before = counts();

    for (const cartToken of [randomUUID(), undefined]) {
      expect(() => processOrder({ accountId, cartToken, locale: "en_US", event: EVENT })).toThrow(
        ShoppingCartEmptyError,
      );
    }

    expect(() =>
      processOrder({ accountId, cartToken: randomUUID(), locale: "en_US", event: EVENT }),
    ).toThrow("Shopping cart is empty");
    expect(counts()).toEqual(before);
  });

  it("logs nothing when the cart is empty", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    expect(() =>
      processOrder({ accountId, cartToken: randomUUID(), locale: "en_US", event: EVENT }),
    ).toThrow(ShoppingCartEmptyError);

    expect(info).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders preconditions", () => {
  it("[SWHR3-C-0159] an empty cart answers 409 SHOPPING_CART_EMPTY and creates nothing", async () => {
    const before = counts();

    await expect(post(fields())).rejects.toMatchObject({
      status: 409,
      data: { code: "SHOPPING_CART_EMPTY" },
    });

    expect(counts()).toEqual(before);
  });

  it("signed out answers 401 and creates nothing", async () => {
    const token = fillCart();
    const before = counts();

    await expect(post(fields(), { cartToken: token, signedIn: false })).rejects.toMatchObject({
      status: 401,
    });

    expect(counts()).toEqual(before);
    expect(getDetails(token)).toEqual({ "VAL-1": 1 });
  });

  it.each([
    ["credit_card_number", { credit_card_number: "" }],
    ["city_b", { city_b: "" }],
  ])("a missing %s answers 422 listing it and creates nothing", async (param, override) => {
    const token = fillCart();
    const before = counts();

    await expect(post(fields(override), { cartToken: token })).rejects.toMatchObject({
      status: 422,
      data: {
        code: "VALIDATION_FAILED",
        missingFields: [param],
        fieldErrors: { [param]: expect.any(String) },
      },
    });

    expect(counts()).toEqual(before);
    expect(getDetails(token)).toEqual({ "VAL-1": 1 });
  });
});
