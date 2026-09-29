import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  lineItems,
  orderContacts,
  orders,
} from "../../../db/schema";
import { getDetails } from "../../../lib/cart";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { startSession } from "../../../lib/session";
import authMiddleware from "../../../middleware/auth";
import cartSession from "../../../middleware/cart-session";
import postOrder from "./index.post";

/**
 * INTEGRATION TEST (server project). design.md C9, D7, D8, D9: POST
 * /api/orders through both middlewares with a real session cookie.
 */
const YEAR = new Date().getFullYear();

let accountId: number;
let sessionCookie: string;

beforeAll(async () => {
  accountId = db
    .insert(accounts)
    .values({ username: "orders-route-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  const started = new H3Event(new Request("http://localhost/api/orders"));
  await startSession(started, { id: accountId, username: "orders-route-user" });
  sessionCookie = (
    started.res.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`)) ?? ""
  ).split(";")[0];

  db.insert(catalogItems)
    .values([
      { itemId: "ORD-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "ORD-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 5000 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "ORD-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "ORD-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: token, itemId: "ORD-1", quantity: 2 },
      { sessionToken: token, itemId: "ORD-2", quantity: 1 },
    ])
    .run();
  return token;
}

function addresses(suffix: "_a" | "_b", city: string, overrides: Record<string, string> = {}) {
  const base: Record<string, string> = {
    family_name: "Chen",
    given_name: suffix === "_a" ? "Sarah" : "Alex",
    address_1: suffix === "_a" ? "1247 Larkspur Avenue" : "88 Market Street",
    address_2: suffix === "_a" ? "Apt 4" : "",
    city,
    state_or_province: "CA",
    postal_code: "94301",
    country: "United States",
    telephone_number: "+1 650 555 0134",
    email: suffix === "_a" ? "sarah.chen@example.com" : "alex@example.com",
    ...overrides,
  };
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [`${k}${suffix}`, v]));
}

function body(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    ...addresses("_a", "Palo Alto"),
    ...addresses("_b", "San Francisco"),
    credit_card_number: "4111 1111 1111 4412",
    credit_card_type: "Duke Express",
    expiration_month: "03",
    expiration_year: String(YEAR + 2),
    ...overrides,
  };
}

async function send(
  payload: unknown,
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

function orderCount(): number {
  return db.select({ n: count() }).from(orders).get()?.n ?? 0;
}

describe("POST /api/orders", () => {
  it("[SWHR3-C-0131] places an order from billing, shipping and payment", async () => {
    const token = fillCart();

    const result = (await send(body(), { cartToken: token })) as {
      orderId: number;
      orderDate: string;
      email: string;
    };

    expect(result.email).toBe("sarah.chen@example.com");
    const order = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(order?.cardType).toBe("Duke Express");
    const contacts = db
      .select()
      .from(orderContacts)
      .where(eq(orderContacts.orderId, result.orderId))
      .all();
    expect(contacts.find((c) => c.role === "BILL_TO")).toMatchObject({
      city: "Palo Alto",
      givenName: "Sarah",
    });
    expect(contacts.find((c) => c.role === "SHIP_TO")).toMatchObject({
      city: "San Francisco",
      givenName: "Alex",
    });
    expect(
      db.select().from(lineItems).where(eq(lineItems.orderId, result.orderId)).all(),
    ).toHaveLength(2);
    expect(getDetails(token)).toEqual({});
  });

  it("[SWHR3-C-0122] the order belongs to the signed-in account", async () => {
    const result = (await send(body(), { cartToken: fillCart() })) as { orderId: number };

    const order = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(order?.accountId).toBe(accountId);
  });

  it("[SWHR3-C-0114] stores the card expiry as MM/YYYY", async () => {
    const result = (await send(body(), { cartToken: fillCart() })) as { orderId: number };

    const order = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(order?.cardExpiry).toBe(`03/${YEAR + 2}`);
  });

  it("[SWHR3-C-0101] an order without address line 2 stores null", async () => {
    const payload = body();
    delete payload.address_2_a;
    delete payload.address_2_b;

    const result = (await send(payload, { cartToken: fillCart() })) as { orderId: number };

    const contacts = db
      .select()
      .from(orderContacts)
      .where(eq(orderContacts.orderId, result.orderId))
      .all();
    expect(contacts).toHaveLength(2);
    expect(contacts.every((c) => c.address2 === null)).toBe(true);
  });

  it("[SWHR3-C-0103] a missing billing field answers 422 and creates nothing", async () => {
    const token = fillCart();
    const before = orderCount();

    await expect(send(body({ city_a: "" }), { cartToken: token })).rejects.toMatchObject({
      status: 422,
      data: {
        code: "VALIDATION_FAILED",
        missingFields: ["city_a"],
        fieldErrors: { city_a: expect.any(String) },
      },
    });

    expect(orderCount()).toBe(before);
    expect(getDetails(token)).toEqual({ "ORD-1": 2, "ORD-2": 1 });
  });

  it("[SWHR3-C-0142] a validation failure writes nothing", async () => {
    const token = fillCart();
    const payload = body();
    delete payload.credit_card_number;
    const orderRows = orderCount();
    const contactRows = db.select({ n: count() }).from(orderContacts).get()?.n ?? 0;

    await expect(send(payload, { cartToken: token })).rejects.toMatchObject({ status: 422 });

    expect(orderCount()).toBe(orderRows);
    expect(db.select({ n: count() }).from(orderContacts).get()?.n ?? 0).toBe(contactRows);
    expect(getDetails(token)).toEqual({ "ORD-1": 2, "ORD-2": 1 });
  });

  it("[SWHR3-C-0116] an empty cart answers 409 and creates nothing", async () => {
    const before = orderCount();

    await expect(send(body())).rejects.toMatchObject({
      status: 409,
      message: "Shopping cart is empty",
      data: { code: "SHOPPING_CART_EMPTY" },
    });

    expect(orderCount()).toBe(before);
  });

  it("answers 401 when signed out", async () => {
    await expect(send(body(), { cartToken: fillCart(), signedIn: false })).rejects.toMatchObject({
      status: 401,
    });
  });
});
