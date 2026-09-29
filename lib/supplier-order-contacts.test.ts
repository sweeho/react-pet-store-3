import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, orders, supplierPurchaseOrders } from "../db/schema";
import { NotFoundError } from "./errors";
import { getSupplierContact, insertSupplierContact } from "./supplier-order-contacts";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D4, C3 (supplier-portal-and-
 * inventory): a supplier PO's delivery contact is stored 1:1 with the PO.
 * Copying it from the order's SHIP_TO snapshot happens when the POs are
 * created (allocation), which is another ticket's code; this covers the
 * contact module that copy writes through.
 */
const CONTACT = {
  givenName: "Alex",
  familyName: "Chen",
  email: "alex@example.com",
  telephone: "+1 415 555 0177",
};

let orderId: number;

beforeAll(() => {
  const accountId = db
    .insert(accounts)
    .values({ username: "supplier-contact-user", passwordHash: "not-a-real-hash" })
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

describe("supplier PO delivery contact", () => {
  it("[SWHR3-C-0202] all four fields round-trip", () => {
    const poId = makePo();

    withTransaction((tx) => insertSupplierContact(tx, poId, CONTACT));

    expect(getSupplierContact(poId)).toEqual(CONTACT);
  });

  it("[SWHR3-C-0202] a second contact for the same PO fails and leaves the first", () => {
    const poId = makePo();
    withTransaction((tx) => insertSupplierContact(tx, poId, CONTACT));

    expect(() =>
      withTransaction((tx) => insertSupplierContact(tx, poId, { ...CONTACT, givenName: "Other" })),
    ).toThrow();

    expect(getSupplierContact(poId).givenName).toBe("Alex");
  });

  it("throws NotFoundError for a PO with no contact", () => {
    expect(() => getSupplierContact(makePo())).toThrow(NotFoundError);
  });
});
