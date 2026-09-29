import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  inventory,
  inventoryReservations,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import {
  getInventory,
  getInventoryItem,
  reserveInventory,
  setInventory,
  updateQuantity,
} from "./inventory";
import { NotFoundError } from "./errors";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D5, C6: reservation is all or
 * nothing, so an order that cannot be covered changes no stock.
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
const ITEMS = ["INV-1", "INV-2"];

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "inventory-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values(
      ITEMS.map((itemId) => ({
        itemId,
        productId: "FI-SW-01",
        category: "FISH",
        unitCostCents: 1000,
      })),
    )
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values(ITEMS.map((itemId) => ({ itemId, locale: "en_US", name: itemId, attribute: "x" })))
    .onConflictDoNothing()
    .run();
});

function place(quantities: [number, number]): number {
  const cartToken = randomUUID();
  db.insert(cartItems)
    .values(
      ITEMS.map((itemId, i) => ({ sessionToken: cartToken, itemId, quantity: quantities[i] })),
    )
    .run();
  return placeOrder({ accountId, cartToken, locale: "en_US", event: EVENT }).orderId;
}

function stock(itemId: string): number | undefined {
  return db.select().from(inventory).where(eq(inventory.itemId, itemId)).get()?.quantity;
}

function reservations(orderId: number) {
  return db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, orderId))
    .orderBy(inventoryReservations.itemId)
    .all();
}

const reserve = (orderId: number, lines: { itemId: string; quantity: number }[]) =>
  withTransaction((tx) => reserveInventory(tx, orderId, lines));

describe("reserveInventory", () => {
  it("decrements every item and records a reservation per line when all are covered", () => {
    setInventory("INV-1", 5);
    setInventory("INV-2", 3);
    const orderId = place([2, 3]);

    expect(
      reserve(orderId, [
        { itemId: "INV-1", quantity: 2 },
        { itemId: "INV-2", quantity: 3 },
      ]),
    ).toBe(true);

    expect(stock("INV-1")).toBe(3);
    expect(stock("INV-2")).toBe(0);
    expect(reservations(orderId).map((r) => [r.itemId, r.quantity])).toEqual([
      ["INV-1", 2],
      ["INV-2", 3],
    ]);
  });

  it("[SWHR3-C-0173] insufficient stock reserves nothing and returns false", () => {
    setInventory("INV-1", 5);
    setInventory("INV-2", 0);
    const orderId = place([2, 1]);

    expect(
      reserve(orderId, [
        { itemId: "INV-1", quantity: 2 },
        { itemId: "INV-2", quantity: 1 },
      ]),
    ).toBe(false);

    expect(stock("INV-1")).toBe(5);
    expect(stock("INV-2")).toBe(0);
    expect(reservations(orderId)).toEqual([]);
  });

  it("one short line among covered ones leaves every quantity unchanged", () => {
    setInventory("INV-1", 2);
    setInventory("INV-2", 3);
    const orderId = place([2, 4]);

    expect(
      reserve(orderId, [
        { itemId: "INV-1", quantity: 2 },
        { itemId: "INV-2", quantity: 4 },
      ]),
    ).toBe(false);

    expect([stock("INV-1"), stock("INV-2")]).toEqual([2, 3]);
    expect(reservations(orderId)).toEqual([]);
  });

  it("an item with no inventory row counts as 0 and returns false", () => {
    db.delete(inventory).where(eq(inventory.itemId, "INV-2")).run();
    setInventory("INV-1", 9);
    const orderId = place([1, 1]);

    expect(
      reserve(orderId, [
        { itemId: "INV-1", quantity: 1 },
        { itemId: "INV-2", quantity: 1 },
      ]),
    ).toBe(false);

    expect(stock("INV-1")).toBe(9);
    expect(reservations(orderId)).toEqual([]);
  });

  it("repeated lines for one item are summed against the stock", () => {
    setInventory("INV-1", 3);
    const orderId = place([1, 1]);
    const lines = [
      { itemId: "INV-1", quantity: 2 },
      { itemId: "INV-1", quantity: 2 },
    ];

    expect(reserve(orderId, lines)).toBe(false);
    expect(stock("INV-1")).toBe(3);

    setInventory("INV-1", 4);
    expect(reserve(orderId, lines)).toBe(true);
    expect(stock("INV-1")).toBe(0);
    expect(reservations(orderId).map((r) => [r.itemId, r.quantity])).toEqual([["INV-1", 4]]);
  });
});

describe("setInventory", () => {
  it("inserts a missing row and overwrites an existing one", () => {
    db.delete(inventory).where(eq(inventory.itemId, "INV-2")).run();

    setInventory("INV-2", 7);
    expect(stock("INV-2")).toBe(7);
    setInventory("INV-2", 2);
    expect(stock("INV-2")).toBe(2);
  });
});

describe("inventory listing and updates", () => {
  const LIST_ITEMS = ["LST-1", "LST-2", "LST-3"];

  beforeAll(() => {
    db.insert(catalogItems)
      .values(
        LIST_ITEMS.map((itemId) => ({
          itemId,
          productId: "FI-SW-01",
          category: "FISH",
          unitCostCents: 1000,
        })),
      )
      .onConflictDoNothing()
      .run();
    db.delete(inventory).where(inArray(inventory.itemId, LIST_ITEMS)).run();
    setInventory("LST-1", 5);
    setInventory("LST-2", 0);
  });

  it("[SWHR3-C-0200] lists every catalogue item in item order, a missing row reading 0", () => {
    expect(getInventory().filter((row) => row.itemId.startsWith("LST-"))).toEqual([
      { itemId: "LST-1", quantity: 5 },
      { itemId: "LST-2", quantity: 0 },
      { itemId: "LST-3", quantity: 0 },
    ]);
  });

  it("[SWHR3-C-0200] reads one item, and refuses a non-catalogue item", () => {
    expect(getInventoryItem("LST-3")).toEqual({ itemId: "LST-3", quantity: 0 });
    expect(getInventoryItem("LST-1")).toEqual({ itemId: "LST-1", quantity: 5 });
    expect(() => getInventoryItem("NOPE")).toThrow(NotFoundError);
  });

  it("[SWHR3-C-0201] updateQuantity sets the quantity and reports before and after", () => {
    expect(withTransaction((tx) => updateQuantity(tx, "LST-1", 12))).toEqual({
      before: 5,
      after: 12,
    });
    expect(withTransaction((tx) => updateQuantity(tx, "LST-3", 4))).toEqual({
      before: 0,
      after: 4,
    });

    expect(stock("LST-1")).toBe(12);
    expect(stock("LST-3")).toBe(4);
  });
});
