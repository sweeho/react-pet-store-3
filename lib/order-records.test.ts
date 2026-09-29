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
  orderStageHistory,
  orders,
  paymentAuthorizations,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { NotFoundError } from "./errors";
import { getOrderRecord, listOrdersByStage } from "./order-records";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md C1, C2 (order-processing-and-
 * fulfilment): the workflow schema and the finders that read a whole order
 * back. The order is written by placeOrder, the checkout entry point that
 * exists at this point in the chain.
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
  receiver: { ...BILL_TO, givenName: "Gift", city: "San Francisco" },
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-records-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "REC-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "REC-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "REC-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "REC-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

function place(): number {
  const cartToken = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: cartToken, itemId: "REC-1", quantity: 2 },
      { sessionToken: cartToken, itemId: "REC-2", quantity: 1 },
    ])
    .run();
  return placeOrder({ accountId, cartToken, locale: "en_US", event: EVENT }).orderId;
}

describe("getOrderRecord", () => {
  it("[SWHR3-C-0178] the order total is stored and equals the sum of its lines", () => {
    const orderId = place();

    const record = getOrderRecord(orderId);

    expect(record.order.totalCents).toBe(4548);
    expect(record.lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0)).toBe(4548);
    expect(db.select().from(orders).where(eq(orders.id, orderId)).get()?.totalCents).toBe(4548);
  });

  it("reads a placed order back whole, at stage PENDING with empty workflow collections", () => {
    const orderId = place();

    const record = getOrderRecord(orderId);

    expect(record.order).toMatchObject({ id: orderId, accountId, workflowStage: "PENDING" });
    expect(record.lines.map((l) => [l.lineNumber, l.itemId, l.quantity])).toEqual([
      [1, "REC-1", 2],
      [2, "REC-2", 1],
    ]);
    expect(record.contacts.map((c) => c.role).sort()).toEqual(["BILL_TO", "SHIP_TO"]);
    expect(record.stageHistory).toEqual([]);
    expect(record.payment).toBeNull();
    expect(record.outbox).toEqual([]);
    expect(record.reservations).toEqual([]);
    expect(record.supplierPos).toEqual([]);
  });

  it("includes stage history, payment, reservations and supplier POs when present", () => {
    const orderId = place();
    const at = new Date("2026-09-23T10:15:00.000Z");
    db.insert(orderStageHistory).values({ orderId, stage: "PAID", changedAt: at }).run();
    db.insert(paymentAuthorizations)
      .values({
        orderId,
        processor: "no-charge",
        transactionId: `tx-${orderId}`,
        authorizationCode: "AUTH1",
        amountCents: 4548,
        authorizedAt: at,
      })
      .run();

    const record = getOrderRecord(orderId);

    expect(record.stageHistory.map((h) => h.stage)).toEqual(["PAID"]);
    expect(record.payment).toMatchObject({ transactionId: `tx-${orderId}`, amountCents: 4548 });
    expect(record.lines.every((l) => l.supplierPoId === null)).toBe(true);
    expect(db.select().from(lineItems).where(eq(lineItems.orderId, orderId)).all()).toHaveLength(2);
  });

  it("throws NotFoundError for an unknown order id", () => {
    expect(() => getOrderRecord(999_999)).toThrow(NotFoundError);
  });

  it("reads through a caller's transaction", () => {
    const orderId = place();

    const record = withTransaction((tx) => getOrderRecord(orderId, tx));

    expect(record.order.id).toBe(orderId);
  });
});

describe("listOrdersByStage", () => {
  it("includes a new order at PENDING and no order at a later stage", () => {
    const orderId = place();

    expect(listOrdersByStage("PENDING").map((o) => o.id)).toContain(orderId);
    expect(listOrdersByStage("SHIPPED").map((o) => o.id)).not.toContain(orderId);
  });
});
