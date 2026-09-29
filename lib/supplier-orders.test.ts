import { count, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  lineItems,
  orders,
  supplierPoAddresses,
  supplierPoContacts,
  supplierPurchaseOrders,
} from "../db/schema";
import { NotFoundError } from "./errors";
import { insertSupplierAddress } from "./supplier-order-addresses";
import { insertSupplierContact } from "./supplier-order-contacts";
import { deleteSupplierOrder, getSupplierOrder, listSupplierOrders } from "./supplier-orders";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md C4 (supplier-portal-and-inventory):
 * the supplier order read model (PO with contact, address and line items) and
 * the cascade delete of its contact and address.
 */
const CONTACT = {
  givenName: "Alex",
  familyName: "Chen",
  email: "alex@example.com",
  telephone: "+1 415 555 0177",
};
const ADDRESS = {
  address1: "88 Market Street",
  address2: "Suite 4",
  city: "San Francisco",
  stateOrProvince: "CA",
  postalCode: "94103",
  country: "United States",
};
const PO_DATE = new Date("2026-01-01T00:00:00.000Z");
const DUE = new Date("2026-01-08T00:00:00.000Z");

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-orders-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

/** An order with one PO holding lines EST-1 x2 and EST-2 x1, plus contact and address. */
function makeSupplierOrder(status?: "PENDING" | "PROCESSING" | "COMPLETED"): {
  orderId: number;
  poId: number;
} {
  const orderId = db
    .insert(orders)
    .values({ accountId, customerName: "Alex Chen", orderDate: PO_DATE, totalCents: 4548 })
    .returning({ id: orders.id })
    .get().id;
  const poId = db
    .insert(supplierPurchaseOrders)
    .values({
      orderId,
      supplierId: "PETSTORE-SUPPLIER",
      ...(status ? { status } : {}),
      expectedDeliveryDate: DUE,
      createdAt: PO_DATE,
    })
    .returning({ id: supplierPurchaseOrders.id })
    .get().id;
  db.insert(lineItems)
    .values([
      {
        orderId,
        lineNumber: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        quantity: 2,
        unitPriceCents: 1999,
        supplierPoId: poId,
      },
      {
        orderId,
        lineNumber: 2,
        categoryId: "DOGS",
        productId: "K9-BD-01",
        itemId: "EST-2",
        quantity: 1,
        unitPriceCents: 550,
        supplierPoId: poId,
      },
    ])
    .run();
  withTransaction((tx) => {
    insertSupplierContact(tx, poId, CONTACT);
    insertSupplierAddress(tx, poId, ADDRESS);
  });
  return { orderId, poId };
}

function rowCount(table: typeof supplierPoContacts | typeof supplierPoAddresses, poId: number) {
  return db.select({ n: count() }).from(table).where(eq(table.supplierPoId, poId)).get()?.n ?? 0;
}

describe("getSupplierOrder", () => {
  it("[SWHR3-C-0205] lines expose all seven attributes, with the PO, contact and address", () => {
    const { orderId, poId } = makeSupplierOrder();

    const po = getSupplierOrder(poId);

    expect(po).toMatchObject({
      poId,
      poDate: PO_DATE,
      poStatus: "PENDING",
      orderId,
      supplierId: "PETSTORE-SUPPLIER",
      expectedDeliveryDate: DUE,
      trackingNumber: null,
      contact: CONTACT,
      address: ADDRESS,
    });
    expect(po.lines).toEqual([
      {
        itemId: "EST-1",
        quantity: 2,
        quantityShipped: 0,
        lineNumber: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        unitPriceCents: 1999,
      },
      {
        itemId: "EST-2",
        quantity: 1,
        quantityShipped: 0,
        lineNumber: 2,
        categoryId: "DOGS",
        productId: "K9-BD-01",
        unitPriceCents: 550,
      },
    ]);
  });

  it("only returns the lines linked to that PO", () => {
    const { orderId, poId } = makeSupplierOrder();
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: 3,
        categoryId: "CATS",
        productId: "FL-DSH-01",
        itemId: "EST-3",
        quantity: 1,
        unitPriceCents: 100,
      })
      .run();

    expect(getSupplierOrder(poId).lines.map((l) => l.itemId)).toEqual(["EST-1", "EST-2"]);
  });

  it("reads a PO with no contact or address yet as null for both", () => {
    const orderId = db
      .insert(orders)
      .values({ accountId, customerName: "No Contact", orderDate: PO_DATE, totalCents: 1 })
      .returning({ id: orders.id })
      .get().id;
    const poId = db
      .insert(supplierPurchaseOrders)
      .values({ orderId, supplierId: "S", expectedDeliveryDate: DUE, createdAt: PO_DATE })
      .returning({ id: supplierPurchaseOrders.id })
      .get().id;

    expect(getSupplierOrder(poId)).toMatchObject({ contact: null, address: null, lines: [] });
  });

  it("throws NotFoundError for an unknown PO", () => {
    expect(() => getSupplierOrder(999_999)).toThrow(NotFoundError);
  });
});

describe("listSupplierOrders", () => {
  it("filters by status and lists every PO without one", () => {
    const pending = makeSupplierOrder("PENDING");
    const processing = makeSupplierOrder("PROCESSING");

    const pendingIds = listSupplierOrders("PENDING").map((p) => p.poId);
    const processingIds = listSupplierOrders("PROCESSING").map((p) => p.poId);
    const allIds = listSupplierOrders().map((p) => p.poId);

    expect(pendingIds).toContain(pending.poId);
    expect(pendingIds).not.toContain(processing.poId);
    expect(processingIds).toContain(processing.poId);
    expect(processingIds).not.toContain(pending.poId);
    expect(allIds).toEqual(expect.arrayContaining([pending.poId, processing.poId]));
  });
});

describe("deleteSupplierOrder", () => {
  it("[SWHR3-C-0204] removes the PO's contact and address", () => {
    const { poId } = makeSupplierOrder();
    expect(rowCount(supplierPoContacts, poId)).toBe(1);
    expect(rowCount(supplierPoAddresses, poId)).toBe(1);

    withTransaction((tx) => deleteSupplierOrder(tx, poId));

    expect(rowCount(supplierPoContacts, poId)).toBe(0);
    expect(rowCount(supplierPoAddresses, poId)).toBe(0);
    expect(() => getSupplierOrder(poId)).toThrow(NotFoundError);
  });

  it("unlinks the PO's line items instead of deleting them", () => {
    const { orderId, poId } = makeSupplierOrder();

    withTransaction((tx) => deleteSupplierOrder(tx, poId));

    const rows = db.select().from(lineItems).where(eq(lineItems.orderId, orderId)).all();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.supplierPoId === null)).toBe(true);
  });
});
