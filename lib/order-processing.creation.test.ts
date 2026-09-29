import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { accounts, cartItems, catalogItemDetails, catalogItems, orders } from "../db/schema";
import postOrder from "../routes/api/orders/index.post";
import authMiddleware from "../middleware/auth";
import cartSession from "../middleware/cart-session";
import { AUTH_CONFIG } from "./auth-config";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { processOrder } from "./order-processing";
import { getOrderRecord } from "./order-records";
import { startSession } from "./session";

/**
 * UNIT / INTEGRATION TEST (server project). design.md SD8, SD9: an order
 * placed through processOrder is persisted with a unique id, the current
 * date, the session's account and the billing email. Proof only: no
 * production file changes.
 */
const BILL_TO: ContactInfo = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1247 Larkspur Avenue",
  address2: null,
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "United States",
  telephoneNumber: "+1 650 555 0134",
  email: "sarah.chen@example.com",
};
const SHIP_TO: ContactInfo = {
  ...BILL_TO,
  givenName: "Gift",
  city: "San Francisco",
  email: "gift@example.com",
};
const EVENT = {
  shipper: BILL_TO,
  receiver: SHIP_TO,
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-creation-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "OC-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "OC-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "OC-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "OC-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.useRealTimers();
});

function fillCart(
  items: [string, number][] = [
    ["OC-1", 2],
    ["OC-2", 1],
  ],
): string {
  const token = randomUUID();
  db.insert(cartItems)
    .values(items.map(([itemId, quantity]) => ({ sessionToken: token, itemId, quantity })))
    .run();
  return token;
}

function place(cartToken: string) {
  return processOrder({ accountId, cartToken, locale: "en_US", event: EVENT });
}

describe("processOrder order creation", () => {
  it("[SWHR3-C-0156] a valid cart and checkout create a persisted order", () => {
    const placed = place(fillCart());

    expect(Number.isInteger(placed.orderId)).toBe(true);
    const record = getOrderRecord(placed.orderId);
    expect(record.order.id).toBe(placed.orderId);
    expect(record.lines).toHaveLength(2);
    expect(record.contacts.map((c) => c.role).sort()).toEqual(["BILL_TO", "SHIP_TO"]);
    expect(record.payment).not.toBeNull();
    expect(record.outbox).toHaveLength(1);
  });

  it("[SWHR3-C-0160] each placed order gets a distinct id", () => {
    const ids = Array.from({ length: 10 }, () => place(fillCart([["OC-1", 1]])).orderId);

    expect(new Set(ids).size).toBe(10);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(db.select().from(orders).where(eq(orders.id, id)).get()).toBeDefined();
    }
  });

  it("[SWHR3-C-0161] the order date is the moment of placement", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T09:00:00Z"));

    const placed = place(fillCart());

    expect(placed.orderDate).toBe("2026-10-01T09:00:00.000Z");
    const stored = db.select().from(orders).where(eq(orders.id, placed.orderId)).get();
    expect(stored?.orderDate.toISOString()).toBe("2026-10-01T09:00:00.000Z");
  });

  it("[SWHR3-C-0183] the order records the given account and the billing email, not the shipping one", () => {
    const placed = place(fillCart());

    const stored = db.select().from(orders).where(eq(orders.id, placed.orderId)).get();
    expect(stored?.accountId).toBe(accountId);
    expect(stored?.email).toBe("sarah.chen@example.com");
    expect(placed.email).toBe("sarah.chen@example.com");
  });
});

describe("POST /api/orders order creation", () => {
  it("[SWHR3-C-0183] a signed-in post stores the session account and the billing email", async () => {
    const started = new H3Event(new Request("http://localhost/api/orders"));
    await startSession(started, { id: accountId, username: "order-creation-user" });
    const sessionCookie = (
      started.res.headers
        .getSetCookie()
        .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`)) ?? ""
    ).split(";")[0];
    const address = (suffix: "_a" | "_b", info: ContactInfo) => ({
      [`family_name${suffix}`]: info.familyName,
      [`given_name${suffix}`]: info.givenName,
      [`address_1${suffix}`]: info.address1,
      [`city${suffix}`]: info.city,
      [`state_or_province${suffix}`]: info.stateOrProvince,
      [`postal_code${suffix}`]: info.postalCode,
      [`country${suffix}`]: info.country,
      [`telephone_number${suffix}`]: info.telephoneNumber,
      [`email${suffix}`]: info.email,
    });
    const body = {
      ...address("_a", BILL_TO),
      ...address("_b", SHIP_TO),
      credit_card_number: "4111 1111 1111 4412",
      credit_card_type: "Java Card",
      expiration_month: "03",
      expiration_year: String(new Date().getFullYear() + 2),
    };
    const event = new H3Event(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${sessionCookie}; petstore_cart=${fillCart()}`,
        },
        body: JSON.stringify(body),
      }),
    );
    await authMiddleware(event);
    await cartSession(event);

    const result = (await postOrder(event)) as { orderId: number };

    const stored = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(stored?.accountId).toBe(accountId);
    expect(stored?.email).toBe("sarah.chen@example.com");
  });
});
