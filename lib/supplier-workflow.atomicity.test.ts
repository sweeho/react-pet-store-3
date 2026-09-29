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
  orders,
  supplierPoAddresses,
  supplierPoContacts,
  supplierPurchaseOrders,
} from "../db/schema";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { getInventoryItem, setInventory } from "./inventory";
import { applyInventoryUpdate } from "./inventory-update";
import { updateOrders } from "./order-approval";
import { processOrder } from "./order-processing";
import * as supplierFulfilment from "./supplier-fulfilment";
import * as supplierAddresses from "./supplier-order-addresses";
import { withTransaction } from "./transaction";

vi.mock("./supplier-order-addresses", async (importOriginal) => {
  const original = await importOriginal<typeof import("./supplier-order-addresses")>();
  return { ...original, insertSupplierAddress: vi.fn(original.insertSupplierAddress) };
});

vi.mock("./supplier-fulfilment", async (importOriginal) => {
  const original = await importOriginal<typeof import("./supplier-fulfilment")>();
  return {
    ...original,
    processPendingSupplierOrders: vi.fn(original.processPendingSupplierOrders),
  };
});

/**
 * UNIT TEST (server project). design.md D3, D6 (supplier-portal-and-
 * inventory): PO creation (PO, contact, address, reservation) and an
 * inventory update with its reprocessing are each all-or-nothing. Proof
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
  receiver: { ...BILL_TO, givenName: "Alex", address1: "88 Market Street" },
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-atomicity-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values(
      ["EST-1", "EST-2"].map((itemId) => ({
        itemId,
        productId: "FI-SW-01",
        category: "FISH",
        unitCostCents: 1650,
      })),
    )
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values(
      ["EST-1", "EST-2"].map((itemId) => ({
        itemId,
        locale: "en_US",
        name: itemId,
        attribute: "x",
      })),
    )
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A PENDING order at CONFIRMED with a SHIP_TO snapshot and one line of EST-1 x 2. */
function confirmedOrder(): number {
  const cartToken = randomUUID();
  db.insert(cartItems).values({ sessionToken: cartToken, itemId: "EST-1", quantity: 2 }).run();
  return processOrder({ accountId, cartToken, locale: "en_US", event: EVENT }).orderId;
}

type CountedTable =
  | typeof supplierPurchaseOrders
  | typeof supplierPoContacts
  | typeof supplierPoAddresses
  | typeof inventoryReservations;

const rowCount = (table: CountedTable): number =>
  db.select({ n: count() }).from(table).get()?.n ?? 0;

describe("PO creation atomicity", () => {
  it("[SWHR3-C-0221] a failure writing the delivery address rolls back the whole PO creation", () => {
    const orderId = confirmedOrder();
    setInventory("EST-1", 5);
    const before = {
      pos: rowCount(supplierPurchaseOrders),
      contacts: rowCount(supplierPoContacts),
      addresses: rowCount(supplierPoAddresses),
      reservations: rowCount(inventoryReservations),
    };
    vi.mocked(supplierAddresses.insertSupplierAddress).mockImplementationOnce(() => {
      throw new Error("address store down");
    });

    expect(() => updateOrders({ changes: [{ orderId, status: "APPROVED" }] })).toThrow(
      "address store down",
    );

    expect({
      pos: rowCount(supplierPurchaseOrders),
      contacts: rowCount(supplierPoContacts),
      addresses: rowCount(supplierPoAddresses),
      reservations: rowCount(inventoryReservations),
    }).toEqual(before);
    expect(getInventoryItem("EST-1").quantity).toBe(5);
    expect(db.select().from(orders).where(eq(orders.id, orderId)).get()).toMatchObject({
      status: "PENDING",
      workflowStage: "CONFIRMED",
    });
  });

  it("approves normally once the failure is gone, proving the rollback left it retryable", () => {
    const orderId = confirmedOrder();
    setInventory("EST-1", 5);
    vi.mocked(supplierAddresses.insertSupplierAddress).mockImplementationOnce(() => {
      throw new Error("address store down");
    });
    expect(() => updateOrders({ changes: [{ orderId, status: "APPROVED" }] })).toThrow();

    updateOrders({ changes: [{ orderId, status: "APPROVED" }] });

    expect(db.select().from(orders).where(eq(orders.id, orderId)).get()).toMatchObject({
      status: "APPROVED",
      workflowStage: "ALLOCATED",
    });
    expect(getInventoryItem("EST-1").quantity).toBe(3);
  });
});

describe("inventory update atomicity", () => {
  it("[SWHR3-C-0222] a reprocessing failure rolls back the inventory update", () => {
    setInventory("EST-1", 1);
    setInventory("EST-2", 1);
    vi.mocked(supplierFulfilment.processPendingSupplierOrders).mockImplementationOnce(() => {
      throw new Error("reprocessing down");
    });

    expect(() =>
      applyInventoryUpdate([
        { itemId: "EST-1", quantity: 9 },
        { itemId: "EST-2", quantity: 9 },
      ]),
    ).toThrow("reprocessing down");

    expect(getInventoryItem("EST-1").quantity).toBe(1);
    expect(getInventoryItem("EST-2").quantity).toBe(1);
    expect(db.select().from(inventory).where(eq(inventory.itemId, "EST-1")).get()?.quantity).toBe(
      1,
    );
  });

  it("[SWHR3-C-0223] applyInventoryUpdate joins an outer transaction", () => {
    setInventory("EST-1", 1);
    const spy = vi.spyOn(db, "transaction");

    const result = withTransaction((tx) =>
      applyInventoryUpdate([{ itemId: "EST-1", quantity: 12 }], tx),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.updated).toEqual(["EST-1"]);
    expect(getInventoryItem("EST-1").quantity).toBe(12);
  });
});
