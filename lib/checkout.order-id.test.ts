import { randomUUID } from "node:crypto";
import { eq, max } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  lineItems,
  orderContacts,
  orders,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";

/**
 * UNIT TEST (server project). design.md D5: the order id is orders.id, which
 * SQLite AUTOINCREMENT never reuses, and the order date is the moment of
 * placement.
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
  receiver: { ...BILL_TO, givenName: "Gift" },
  creditCard: createCreditCard("4111 1111 1111 1111", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-id-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values({ itemId: "OID-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values({ itemId: "OID-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.useRealTimers();
});

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems).values({ sessionToken: token, itemId: "OID-1", quantity: 1 }).run();
  return token;
}

function place(cartToken: string) {
  return placeOrder({ accountId, cartToken, locale: "en_US", event: EVENT });
}

describe("order id and date", () => {
  it("[SWHR3-C-0119] twenty placed orders get twenty distinct ids", async () => {
    const ids: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      ids.push(place(fillCart()).orderId);
    }
    const tokens = Array.from({ length: 10 }, fillCart);
    const concurrent = await Promise.all(
      tokens.map((token) => Promise.resolve().then(() => place(token).orderId)),
    );
    ids.push(...concurrent);

    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it("[SWHR3-C-0120] an order id is never reused after a delete", () => {
    place(fillCart());
    place(fillCart());
    const highest = db
      .select({ id: max(orders.id) })
      .from(orders)
      .get()?.id;
    expect(highest).toEqual(expect.any(Number));
    const maxId = highest as number;

    db.delete(lineItems).where(eq(lineItems.orderId, maxId)).run();
    db.delete(orderContacts).where(eq(orderContacts.orderId, maxId)).run();
    db.delete(orders).where(eq(orders.id, maxId)).run();
    const next = place(fillCart()).orderId;

    expect(next).toBeGreaterThan(maxId);
  });

  it("[SWHR3-C-0121] the order date is the moment of placement", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-23T10:15:00.000Z"));

    const result = place(fillCart());

    expect(result.orderDate).toBe("2026-09-23T10:15:00.000Z");
    const row = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(row?.orderDate.toISOString()).toBe("2026-09-23T10:15:00.000Z");
  });
});
