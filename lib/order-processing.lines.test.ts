import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  lineItems,
  notificationOutbox,
  orders,
} from "../db/schema";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { processOrder } from "./order-processing";

/**
 * UNIT TEST (server project). design.md SD9, SD10: every cart line becomes
 * a line_items row and the order total is the sum of the line totals. Proof
 * only: no production file changes.
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
  receiver: BILL_TO,
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-lines-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "EST-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "EST-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

function placeOrder(): number {
  const token = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: token, itemId: "EST-1", quantity: 2 },
      { sessionToken: token, itemId: "EST-2", quantity: 1 },
    ])
    .run();
  return processOrder({ accountId, cartToken: token, locale: "en_US", event: EVENT }).orderId;
}

describe("processOrder line items and total", () => {
  it("[SWHR3-C-0162] every cart line becomes a line item", () => {
    const orderId = placeOrder();

    const rows = db
      .select()
      .from(lineItems)
      .where(eq(lineItems.orderId, orderId))
      .orderBy(lineItems.lineNumber)
      .all();

    expect(
      rows.map((r) => [r.lineNumber, r.productId, r.itemId, r.quantity, r.unitPriceCents]),
    ).toEqual([
      [1, "FI-SW-01", "EST-1", 2, 1999],
      [2, "K9-BD-01", "EST-2", 1, 550],
    ]);
  });

  it("[SWHR3-C-0163] the order total is the sum of line totals, and the outbox payload agrees", () => {
    const orderId = placeOrder();

    const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
    const outbox = db
      .select()
      .from(notificationOutbox)
      .where(eq(notificationOutbox.orderId, orderId))
      .get();
    const payload = JSON.parse(outbox?.payload ?? "{}") as {
      totalCents: number;
      lines: { lineTotalCents: number }[];
    };

    expect(order?.totalCents).toBe(4548);
    expect(payload.totalCents).toBe(4548);
    expect(payload.lines.map((l) => l.lineTotalCents)).toEqual([3998, 550]);
    expect(payload.lines.reduce((sum, l) => sum + l.lineTotalCents, 0)).toBe(4548);
  });
});
