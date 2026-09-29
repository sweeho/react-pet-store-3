import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  inventory,
  inventoryReservations,
  lineItems,
  notificationOutbox,
  orderContacts,
  orderStageHistory,
  orders,
  paymentAuthorizations,
} from "../db/schema";
import { getDetails } from "./cart";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { PaymentDeclinedError } from "./errors";
import * as notifications from "./notifications";
import { processOrder } from "./order-processing";
import { allocateOrder } from "./process-manager";
import { setInventory } from "./inventory";
import * as supplierPos from "./supplier-pos";
import { withTransaction } from "./transaction";

vi.mock("./notifications", async (importOriginal) => {
  const original = await importOriginal<typeof import("./notifications")>();
  return { ...original, queueOrderConfirmation: vi.fn(original.queueOrderConfirmation) };
});

vi.mock("./supplier-pos", async (importOriginal) => {
  const original = await importOriginal<typeof import("./supplier-pos")>();
  return { ...original, createSupplierPOs: vi.fn(original.createSupplierPOs) };
});

/**
 * UNIT TEST (server project). design.md D3, D5, SD3 (order-processing-and-
 * fulfilment): placement and allocation are each all-or-nothing, leaving no partial
 * order state.
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
    .values({ username: "atomicity-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "AT-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "AT-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "AT-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "AT-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
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
      { sessionToken: token, itemId: "AT-1", quantity: 2 },
      { sessionToken: token, itemId: "AT-2", quantity: 1 },
    ])
    .run();
  return token;
}

const TABLES = [
  orders,
  orderContacts,
  lineItems,
  paymentAuthorizations,
  notificationOutbox,
  orderStageHistory,
] as const;

function counts(): number[] {
  return TABLES.map((table) => db.select({ n: count() }).from(table).get()?.n ?? 0);
}

function place(cartToken: string, event = EVENT, outer?: Parameters<typeof processOrder>[2]) {
  return processOrder({ accountId, cartToken, locale: "en_US", event }, {}, outer);
}

describe("placement atomicity", () => {
  it("[SWHR3-C-0166] a declined card rolls the whole order back and keeps the cart", () => {
    const token = fillCart();
    const before = counts();

    expect(() => place(token, DECLINED_EVENT)).toThrow(PaymentDeclinedError);

    expect(counts()).toEqual(before);
    expect(getDetails(token)).toEqual({ "AT-1": 2, "AT-2": 1 });
  });

  it("[SWHR3-C-0175] a failure during confirmation leaves no partial order", () => {
    const token = fillCart();
    const before = counts();
    vi.mocked(notifications.queueOrderConfirmation).mockImplementationOnce(() => {
      throw new Error("outbox down");
    });

    expect(() => place(token)).toThrow("outbox down");

    expect(counts()).toEqual(before);
    expect(getDetails(token)).toEqual({ "AT-1": 2, "AT-2": 1 });
  });

  it("[SWHR3-C-0177] processOrder joins an outer transaction", () => {
    const token = fillCart();
    const before = counts();
    const spy = vi.spyOn(db, "transaction");

    const placed = withTransaction((tx) => place(token, EVENT, tx));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(counts()[0]).toBe(before[0] + 1);
    expect(placed.orderId).toEqual(expect.any(Number));
  });
});

describe("allocation atomicity", () => {
  it("[SWHR3-C-0176] a failure during allocation leaves stock and stage unchanged", () => {
    const orderId = place(fillCart()).orderId;
    db.update(orders).set({ status: "APPROVED" }).where(eq(orders.id, orderId)).run();
    setInventory("AT-1", 5);
    setInventory("AT-2", 5);
    const stock = () =>
      db
        .select()
        .from(inventory)
        .all()
        .filter((row) => row.itemId.startsWith("AT-"))
        .map((row) => [row.itemId, row.quantity]);
    const stockBefore = stock();
    const reservationsBefore = db.select({ n: count() }).from(inventoryReservations).get()?.n;
    vi.mocked(supplierPos.createSupplierPOs).mockImplementationOnce(() => {
      throw new Error("supplier system down");
    });

    expect(() => withTransaction((tx) => allocateOrder(tx, orderId))).toThrow(
      "supplier system down",
    );

    expect(stock()).toEqual(stockBefore);
    expect(stock()).toEqual([
      ["AT-1", 5],
      ["AT-2", 5],
    ]);
    expect(db.select({ n: count() }).from(inventoryReservations).get()?.n).toBe(reservationsBefore);
    expect(db.select().from(orders).where(eq(orders.id, orderId)).get()?.workflowStage).toBe(
      "CONFIRMED",
    );
  });

  it("allocates normally once the failure is gone, proving the rollback left it retryable", () => {
    const orderId = place(fillCart()).orderId;
    db.update(orders).set({ status: "APPROVED" }).where(eq(orders.id, orderId)).run();
    setInventory("AT-1", 5);
    setInventory("AT-2", 5);
    vi.mocked(supplierPos.createSupplierPOs).mockImplementationOnce(() => {
      throw new Error("supplier system down");
    });
    expect(() => withTransaction((tx) => allocateOrder(tx, orderId))).toThrow();

    const result = withTransaction((tx) => allocateOrder(tx, orderId));

    expect(result).toBe("ALLOCATED");
  });
});
