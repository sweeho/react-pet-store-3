import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
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
import { getDetails } from "./cart";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { PaymentDeclinedError } from "./errors";
import { processOrder } from "./order-processing";
import type { PaymentAuthorizer } from "./payment";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D3, C8 (order-processing-and-
 * fulfilment): processOrder places, pays and confirms an order in one
 * immediate transaction; any failure rolls all of it back.
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
const SHIP_TO: ContactInfo = { ...BILL_TO, givenName: "Gift", city: "San Francisco" };
const EVENT = {
  shipper: BILL_TO,
  receiver: SHIP_TO,
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};
const DECLINED_EVENT = {
  ...EVENT,
  creditCard: createCreditCard("4000 0000 0000 0002", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "order-processing-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "OP-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "OP-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "OP-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "OP-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: token, itemId: "OP-1", quantity: 2 },
      { sessionToken: token, itemId: "OP-2", quantity: 1 },
    ])
    .run();
  return token;
}

function run(cartToken: string, event = EVENT, authorizer?: PaymentAuthorizer) {
  return processOrder({ accountId, cartToken, locale: "en_US", event }, { authorizer });
}

function orderCount(): number {
  return db.select({ n: count() }).from(orders).get()?.n ?? 0;
}

describe("processOrder", () => {
  it("[SWHR3-C-0171] queues one confirmation with details, total and ship-to, at CONFIRMED", () => {
    const placed = run(fillCart());

    const rows = db
      .select()
      .from(notificationOutbox)
      .where(eq(notificationOutbox.orderId, placed.orderId))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: "ORDER_CONFIRMATION",
      status: "QUEUED",
      recipient: "sarah.chen@example.com",
    });
    const payload = JSON.parse(rows[0].payload);
    expect(payload.orderId).toBe(placed.orderId);
    expect(payload.totalCents).toBe(2 * 1999 + 550);
    expect(payload.lines).toHaveLength(2);
    expect(payload.shipTo.city).toBe("San Francisco");
    const order = db.select().from(orders).where(eq(orders.id, placed.orderId)).get();
    expect(order?.workflowStage).toBe("CONFIRMED");
  });

  it("returns the same shape as placeOrder and records one payment", () => {
    const placed = run(fillCart());

    expect(placed).toEqual({
      orderId: expect.any(Number),
      orderDate: expect.any(String),
      email: "sarah.chen@example.com",
    });
    const payments = db
      .select()
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.orderId, placed.orderId))
      .all();
    expect(payments).toHaveLength(1);
    expect(payments[0].amountCents).toBe(4548);
  });

  it("empties the cart", () => {
    const token = fillCart();
    run(token);
    expect(getDetails(token)).toEqual({});
  });

  it("a declined card rolls everything back: no order, cart untouched, nothing logged", () => {
    const token = fillCart();
    const before = orderCount();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    expect(() => run(token, DECLINED_EVENT)).toThrow(PaymentDeclinedError);

    expect(orderCount()).toBe(before);
    expect(getDetails(token)).toEqual({ "OP-1": 2, "OP-2": 1 });
    expect(info).not.toHaveBeenCalled();
  });

  it("uses an injected authorizer", () => {
    const authorizer: PaymentAuthorizer = {
      authorize: vi.fn(() => ({
        approved: true as const,
        transactionId: "FAKE-1",
        authorizationCode: "ABC123",
      })),
    };

    const placed = run(fillCart(), EVENT, authorizer);

    expect(authorizer.authorize).toHaveBeenCalledWith(EVENT.creditCard, 4548);
    const row = db
      .select()
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.orderId, placed.orderId))
      .get();
    expect(row?.transactionId).toBe("FAKE-1");
  });

  it("writes the checkout log line once, after commit, without card data", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const placed = run(fillCart());

    expect(info).toHaveBeenCalledTimes(1);
    const message = String(info.mock.calls[0][0]);
    expect(message).toBe(
      `checkout: order ${placed.orderId} placed by account ${accountId}, 2 lines, 4548 cents`,
    );
    expect(message).not.toContain("4111");
  });

  it("joins an outer transaction, so its caller can roll the whole order back", () => {
    const token = fillCart();
    const before = orderCount();

    expect(() =>
      withTransaction((tx) => {
        processOrder({ accountId, cartToken: token, locale: "en_US", event: EVENT }, {}, tx);
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(orderCount()).toBe(before);
    expect(getDetails(token)).toEqual({ "OP-1": 2, "OP-2": 1 });
  });
});
