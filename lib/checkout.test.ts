import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
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
import { getDetails } from "./cart";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { ShoppingCartEmptyError } from "./errors";
import * as purchaseOrders from "./purchase-orders";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D4, SD2: placeOrder reads the cart,
 * writes the order, contacts and lines, and empties the cart in one
 * immediate transaction, or joins the caller's.
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
  receiver: { ...BILL_TO, givenName: "Gift", address2: "Suite 4" },
  creditCard: createCreditCard("4111 1111 1111 1111", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "checkout-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "EST-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 5000 },
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

afterEach(() => {
  vi.restoreAllMocks();
});

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: token, itemId: "EST-1", quantity: 2 },
      { sessionToken: token, itemId: "EST-2", quantity: 1 },
    ])
    .run();
  return token;
}

function rowCounts() {
  const n = (table: typeof orders | typeof orderContacts | typeof lineItems) =>
    db.select({ n: count() }).from(table).get()?.n ?? 0;
  return { orders: n(orders), contacts: n(orderContacts), lines: n(lineItems) };
}

function input(cartToken: string | undefined) {
  return { accountId, cartToken, locale: "en_US", event: EVENT };
}

describe("placeOrder", () => {
  it("[SWHR3-C-0140] a standalone call runs in one immediate transaction and writes everything", () => {
    const token = fillCart();
    const before = rowCounts();
    const spy = vi.spyOn(db, "transaction");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = placeOrder(input(token));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toEqual({ behavior: "immediate" });
    expect(result.email).toBe("sarah.chen@example.com");
    expect(Number.isNaN(Date.parse(result.orderDate))).toBe(false);
    const after = rowCounts();
    expect(after.orders - before.orders).toBe(1);
    expect(after.contacts - before.contacts).toBe(2);
    expect(after.lines - before.lines).toBe(2);
    const order = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(order?.totalCents).toBe(2 * 1650 + 5000);
    expect(getDetails(token)).toEqual({});
    expect(info).toHaveBeenCalledWith(expect.stringContaining(`order ${result.orderId} placed`));
    expect(info.mock.calls.flat().join(" ")).not.toContain("4111");
  });

  it("[SWHR3-C-0139] joins an outer transaction instead of starting one", () => {
    const token = fillCart();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const spy = vi.spyOn(db, "transaction");

    const result = withTransaction((tx) => placeOrder(input(token), tx));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(db.select().from(orders).where(eq(orders.id, result.orderId)).get()).toBeDefined();
    expect(getDetails(token)).toEqual({});
  });

  it("[SWHR3-C-0141] a failure after the order row leaves nothing behind", () => {
    const token = fillCart();
    const before = rowCounts();
    const original = purchaseOrders.insertPurchaseOrder;
    vi.spyOn(purchaseOrders, "insertPurchaseOrder").mockImplementation((tx, po) => {
      original(tx, po);
      throw new Error("forced failure after the order rows");
    });

    expect(() => placeOrder(input(token))).toThrow("forced failure");

    expect(rowCounts()).toEqual(before);
    expect(getDetails(token)).toEqual({ "EST-1": 2, "EST-2": 1 });
  });

  it("[SWHR3-C-0122] logs one line per order, after the transaction commits, without card data", () => {
    const token = fillCart();
    let inTransactionAtLog: boolean | undefined;
    const info = vi.spyOn(console, "info").mockImplementation(() => {
      inTransactionAtLog = db.$client.inTransaction;
    });

    const { orderId } = placeOrder(input(token));

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      `checkout: order ${orderId} placed by account ${accountId}, 2 lines, 8300 cents`,
    );
    expect(inTransactionAtLog).toBe(false);
  });

  it("logs nothing when the order fails", () => {
    const token = fillCart();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const original = purchaseOrders.insertPurchaseOrder;
    vi.spyOn(purchaseOrders, "insertPurchaseOrder").mockImplementation((tx, po) => {
      original(tx, po);
      throw new Error("forced failure after the order rows");
    });

    expect(() => placeOrder(input(token))).toThrow("forced failure");
    expect(info).not.toHaveBeenCalled();
  });

  it("an empty cart throws ShoppingCartEmptyError and writes nothing", () => {
    const before = rowCounts();
    expect(() => placeOrder(input(randomUUID()))).toThrow(ShoppingCartEmptyError);
    expect(() => placeOrder(input(undefined))).toThrow(ShoppingCartEmptyError);
    expect(rowCounts()).toEqual(before);
  });
});
