import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  lineItems,
  supplierPurchaseOrders,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { InvalidTransitionError, NotFoundError } from "./errors";
import { createSupplierPOs, markPoShipped } from "./supplier-pos";
import { getSupplierAddress } from "./supplier-order-addresses";
import { getSupplierContact, insertSupplierContact } from "./supplier-order-contacts";
import * as suppliers from "./suppliers";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D6, D7, C7: an order's lines become
 * supplier POs grouped by supplier, each with an expected delivery date.
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
  familyName: "Chen",
  givenName: "Alex",
  address1: "88 Market Street",
  address2: null,
  city: "San Francisco",
  stateOrProvince: "CA",
  postalCode: "94103",
  country: "United States",
  telephoneNumber: "+1 415 555 0177",
  email: "alex@example.com",
};
const EVENT = {
  shipper: BILL_TO,
  receiver: SHIP_TO,
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};
const ITEMS = ["SPO-1", "SPO-2", "SPO-3"];
const NOW = new Date("2026-10-01T09:00:00Z");

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-po-user", passwordHash: "not-a-real-hash" })
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

afterEach(() => {
  vi.restoreAllMocks();
});

function placeThreeLineOrder(): {
  orderId: number;
  lines: { lineNumber: number; itemId: string }[];
} {
  const cartToken = randomUUID();
  db.insert(cartItems)
    .values(ITEMS.map((itemId) => ({ sessionToken: cartToken, itemId, quantity: 1 })))
    .run();
  const { orderId } = placeOrder({ accountId, cartToken, locale: "en_US", event: EVENT });
  const lines = db
    .select({ lineNumber: lineItems.lineNumber, itemId: lineItems.itemId })
    .from(lineItems)
    .where(eq(lineItems.orderId, orderId))
    .orderBy(lineItems.lineNumber)
    .all();
  return { orderId, lines };
}

function pos(orderId: number) {
  return db
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.orderId, orderId))
    .orderBy(supplierPurchaseOrders.id)
    .all();
}

function poIdsOfLines(orderId: number): (number | null)[] {
  return db
    .select({ poId: lineItems.supplierPoId })
    .from(lineItems)
    .where(eq(lineItems.orderId, orderId))
    .orderBy(lineItems.lineNumber)
    .all()
    .map((r) => r.poId);
}

describe("createSupplierPOs", () => {
  it("[SWHR3-C-0174] one supplier gives one PO due 7 days out, referenced by every line", () => {
    const { orderId, lines } = placeThreeLineOrder();

    const ids = withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW));

    const rows = pos(orderId);
    expect(ids).toEqual(rows.map((r) => r.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ supplierId: "PETSTORE-SUPPLIER", status: "PENDING" });
    expect(rows[0].expectedDeliveryDate.toISOString()).toBe("2026-10-08T09:00:00.000Z");
    expect(poIdsOfLines(orderId)).toEqual([ids[0], ids[0], ids[0]]);
  });

  it("[SWHR3-C-0174] two suppliers give two POs, one per supplier", () => {
    const { orderId, lines } = placeThreeLineOrder();
    vi.spyOn(suppliers, "supplierForItem").mockImplementation((itemId) =>
      itemId === "SPO-2" ? "SUPPLIER-B" : "PETSTORE-SUPPLIER",
    );

    const ids = withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW));

    const rows = pos(orderId);
    expect(rows.map((r) => r.supplierId).sort()).toEqual(["PETSTORE-SUPPLIER", "SUPPLIER-B"]);
    expect(ids).toHaveLength(2);
    const byId = new Map(rows.map((r) => [r.id, r.supplierId]));
    expect(poIdsOfLines(orderId).map((id) => (id === null ? null : byId.get(id)))).toEqual([
      "PETSTORE-SUPPLIER",
      "SUPPLIER-B",
      "PETSTORE-SUPPLIER",
    ]);
  });
});

describe("createSupplierPOs creation fields and delivery contact", () => {
  it("[SWHR3-C-0197] a new PO has an id, the creation time and PENDING status; another order gets another id", () => {
    const first = placeThreeLineOrder();
    const second = placeThreeLineOrder();

    const [firstId] = withTransaction((tx) =>
      createSupplierPOs(tx, first.orderId, first.lines, NOW),
    );
    const [secondId] = withTransaction((tx) =>
      createSupplierPOs(tx, second.orderId, second.lines, NOW),
    );

    expect(Number.isInteger(firstId)).toBe(true);
    expect(secondId).not.toBe(firstId);
    const [row] = pos(first.orderId);
    expect(row.createdAt.toISOString()).toBe("2026-10-01T09:00:00.000Z");
    expect(row.status).toBe("PENDING");
  });

  it("an explicit status is used", () => {
    const { orderId, lines } = placeThreeLineOrder();

    withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW, { status: "PROCESSING" }));

    expect(pos(orderId)[0].status).toBe("PROCESSING");
  });

  it("[SWHR3-C-0202] creating a PO creates its delivery contact from the shipping snapshot", () => {
    const { orderId, lines } = placeThreeLineOrder();

    const [poId] = withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW));

    expect(getSupplierContact(poId)).toEqual({
      givenName: "Alex",
      familyName: "Chen",
      email: "alex@example.com",
      telephone: "+1 415 555 0177",
    });
    expect(() =>
      withTransaction((tx) =>
        insertSupplierContact(tx, poId, {
          givenName: "Other",
          familyName: "Person",
          email: "o@example.com",
          telephone: "1",
        }),
      ),
    ).toThrow();
  });

  it("[SWHR3-C-0203] the PO contact links to a complete delivery address", () => {
    const { orderId, lines } = placeThreeLineOrder();

    const [poId] = withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW));

    expect(getSupplierAddress(poId)).toEqual({
      address1: "88 Market Street",
      address2: null,
      city: "San Francisco",
      stateOrProvince: "CA",
      postalCode: "94103",
      country: "United States",
    });
  });

  it("two suppliers give two POs, each with its own contact and address", () => {
    const { orderId, lines } = placeThreeLineOrder();
    vi.spyOn(suppliers, "supplierForItem").mockImplementation((itemId) =>
      itemId === "SPO-2" ? "SUPPLIER-B" : "PETSTORE-SUPPLIER",
    );

    const ids = withTransaction((tx) => createSupplierPOs(tx, orderId, lines, NOW));

    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(getSupplierContact(id).givenName).toBe("Alex");
      expect(getSupplierAddress(id).city).toBe("San Francisco");
    }
  });
});

describe("markPoShipped", () => {
  function openPo(): number {
    const { orderId, lines } = placeThreeLineOrder();
    return withTransaction((tx) =>
      createSupplierPOs(tx, orderId, lines, NOW, { status: "PROCESSING" }),
    )[0];
  }

  it("stores COMPLETED, the tracking number and shippedAt", () => {
    const poId = openPo();

    withTransaction((tx) => markPoShipped(tx, poId, "TRK-123"));

    const row = db
      .select()
      .from(supplierPurchaseOrders)
      .where(eq(supplierPurchaseOrders.id, poId))
      .get();
    expect(row).toMatchObject({ status: "COMPLETED", trackingNumber: "TRK-123" });
    expect(row?.shippedAt).toBeInstanceOf(Date);
  });

  it("an unknown PO throws NotFoundError", () => {
    expect(() => withTransaction((tx) => markPoShipped(tx, 999999, "TRK"))).toThrow(NotFoundError);
  });

  it("an already-shipped PO throws InvalidTransitionError and keeps its tracking number", () => {
    const poId = openPo();
    withTransaction((tx) => markPoShipped(tx, poId, "TRK-1"));

    expect(() => withTransaction((tx) => markPoShipped(tx, poId, "TRK-2"))).toThrow(
      InvalidTransitionError,
    );
    expect(
      db
        .select({ t: supplierPurchaseOrders.trackingNumber })
        .from(supplierPurchaseOrders)
        .where(eq(supplierPurchaseOrders.id, poId))
        .get()?.t,
    ).toBe("TRK-1");
  });
});
