import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, lineItems, orderContacts, orders } from "../db/schema";
import type { CartItem } from "./cart-item";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { insertPurchaseOrder, toPurchaseOrder } from "./purchase-orders";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D3, C1, C8: an order stores
 * snapshots of billing, shipping and card, and its lines.
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
const SHIP_TO: ContactInfo = {
  ...BILL_TO,
  givenName: "Gift",
  address1: "2 Market St",
  address2: "Suite 4",
  city: "San Francisco",
  email: "gift@example.com",
};
const LINES: CartItem[] = [
  {
    itemId: "EST-1",
    productId: "FI-SW-01",
    category: "FISH",
    name: "Angelfish",
    attribute: "Large",
    quantity: 2,
    unitCostCents: 1650,
  },
  {
    itemId: "EST-2",
    productId: "K9-BD-01",
    category: "DOGS",
    name: "Bulldog",
    attribute: "Adult",
    quantity: 1,
    unitCostCents: 1850,
  },
];
const EVENT = {
  shipper: BILL_TO,
  receiver: SHIP_TO,
  creditCard: createCreditCard("4111 1111 1111 4412", "Duke Express", 3, 2029),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "purchase-orders-fixture", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

function place(event = EVENT): number {
  const po = toPurchaseOrder(accountId, event, LINES, new Date("2026-01-02T03:04:05.000Z"));
  return withTransaction((tx) => insertPurchaseOrder(tx, po));
}

describe("toPurchaseOrder", () => {
  it("[SWHR3-C-0125] the order email is the billing email", () => {
    const po = toPurchaseOrder(accountId, EVENT, LINES);
    expect(po.emailId).toBe("sarah.chen@example.com");
    expect(po.billTo).toEqual(BILL_TO);
    expect(po.shipTo).toEqual(SHIP_TO);
  });

  it("totals the lines in cents", () => {
    expect(toPurchaseOrder(accountId, EVENT, LINES).totalCents).toBe(2 * 1650 + 1850);
  });
});

describe("insertPurchaseOrder", () => {
  it("[SWHR3-C-0106] stores different billing and shipping addresses as two rows", () => {
    const id = place();

    const rows = db.select().from(orderContacts).where(eq(orderContacts.orderId, id)).all();

    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.role === "BILL_TO")?.city).toBe("Palo Alto");
    expect(rows.find((r) => r.role === "SHIP_TO")?.city).toBe("San Francisco");
  });

  it("keeps a null address2 null and a given address2 intact", () => {
    const id = place();
    const rows = db.select().from(orderContacts).where(eq(orderContacts.orderId, id)).all();
    expect(rows.find((r) => r.role === "BILL_TO")?.address2).toBeNull();
    expect(rows.find((r) => r.role === "SHIP_TO")?.address2).toBe("Suite 4");
  });

  it("writes the order row: PENDING, name from billing, email, card snapshot, total", () => {
    const id = place();

    const order = db.select().from(orders).where(eq(orders.id, id)).get();

    expect(order).toMatchObject({
      accountId,
      customerName: "Sarah Chen",
      status: "PENDING",
      totalCents: 5150,
      email: "sarah.chen@example.com",
      cardType: "Duke Express",
      cardNumber: "4111111111114412",
      cardExpiry: "03/2029",
    });
    expect(order?.orderDate.toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("writes one line item per line, numbered from 1", () => {
    const id = place();

    const rows = db
      .select()
      .from(lineItems)
      .where(and(eq(lineItems.orderId, id)))
      .orderBy(lineItems.lineNumber)
      .all();

    expect(
      rows.map((r) => [r.lineNumber, r.itemId, r.categoryId, r.quantity, r.unitPriceCents]),
    ).toEqual([
      [1, "EST-1", "FISH", 2, 1650],
      [2, "EST-2", "DOGS", 1, 1850],
    ]);
  });

  it("writes nothing when the surrounding transaction rolls back", () => {
    const before = db.select().from(orders).all().length;
    const po = toPurchaseOrder(accountId, EVENT, LINES);

    expect(() =>
      withTransaction((tx) => {
        insertPurchaseOrder(tx, po);
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(db.select().from(orders).all()).toHaveLength(before);
  });
});
