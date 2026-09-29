import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, orders, supplierPurchaseOrders } from "../db/schema";
import { NotFoundError } from "./errors";
import { getSupplierAddress, insertSupplierAddress } from "./supplier-order-addresses";
import { insertSupplierContact } from "./supplier-order-contacts";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D4, C3 (supplier-portal-and-
 * inventory): a supplier PO's delivery address is stored 1:1 with its
 * contact. Copying it from the order's SHIP_TO snapshot happens when the POs
 * are created (allocation), which is another ticket's code; this covers the
 * address module that copy writes through.
 */
const CONTACT = {
  givenName: "Alex",
  familyName: "Chen",
  email: "alex@example.com",
  telephone: "+1 415 555 0177",
};
const ADDRESS = {
  address1: "88 Market Street",
  address2: null,
  city: "San Francisco",
  stateOrProvince: "CA",
  postalCode: "94103",
  country: "United States",
};

let orderId: number;

beforeAll(() => {
  const accountId = db
    .insert(accounts)
    .values({ username: "supplier-address-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  orderId = db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alex Chen",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1000,
    })
    .returning({ id: orders.id })
    .get().id;
});

function makePo(): number {
  return db
    .insert(supplierPurchaseOrders)
    .values({
      orderId,
      supplierId: "PETSTORE-SUPPLIER",
      expectedDeliveryDate: new Date("2026-01-08T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    .returning({ id: supplierPurchaseOrders.id })
    .get().id;
}

describe("supplier PO delivery address", () => {
  it("[SWHR3-C-0203] all six fields round-trip with a null line 2", () => {
    const poId = makePo();

    withTransaction((tx) => {
      insertSupplierContact(tx, poId, CONTACT);
      insertSupplierAddress(tx, poId, ADDRESS);
    });

    expect(getSupplierAddress(poId)).toEqual(ADDRESS);
  });

  it("[SWHR3-C-0203] a line 2 is kept when given", () => {
    const poId = makePo();

    withTransaction((tx) => {
      insertSupplierContact(tx, poId, CONTACT);
      insertSupplierAddress(tx, poId, { ...ADDRESS, address2: "Suite 4" });
    });

    expect(getSupplierAddress(poId).address2).toBe("Suite 4");
  });

  it("[SWHR3-C-0203] inserting an address without a contact fails", () => {
    const poId = makePo();

    expect(() => withTransaction((tx) => insertSupplierAddress(tx, poId, ADDRESS))).toThrow();

    expect(() => getSupplierAddress(poId)).toThrow(NotFoundError);
  });

  it("throws NotFoundError for a PO with no address", () => {
    expect(() => getSupplierAddress(makePo())).toThrow(NotFoundError);
  });
});
