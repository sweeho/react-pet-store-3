import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, catalogItemDetails, catalogItems } from "../db/schema";
import type { CartItem } from "./cart-item";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { NotFoundError } from "./errors";
import { getOrderConfirmation } from "./order-confirmation";
import { insertPurchaseOrder, toPurchaseOrder } from "./purchase-orders";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md C9: the confirmation joins orders,
 * order_contacts and line_items, masks the card, and is scoped to the owner.
 */
const BILL_TO: ContactInfo = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1247 Larkspur Avenue",
  address2: null,
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "United States",
  telephoneNumber: "+1 650 555 0134",
  email: "sarah.chen@example.com",
};
const SHIP_TO: ContactInfo = {
  ...BILL_TO,
  givenName: "Gift",
  address1: "88 Market Street",
  address2: "Suite 4",
  city: "San Francisco",
  email: "gift@example.com",
};
const LINES: CartItem[] = [
  {
    itemId: "EST-6",
    productId: "K9-BD-01",
    category: "DOGS",
    name: "Male Adult Bulldog",
    attribute: "Spotted",
    quantity: 2,
    unitCostCents: 1850,
  },
  {
    itemId: "EST-16",
    productId: "FL-DLH-02",
    category: "CATS",
    name: "Adult Female Persian",
    attribute: "White",
    quantity: 1,
    unitCostCents: 9350,
  },
];

let ownerId: number;
let strangerId: number;
let orderId: number;

function makeAccount(username: string): number {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
}

beforeAll(() => {
  // Line items store ids and prices; names come from the catalogue.
  db.insert(catalogItems)
    .values([
      { itemId: "EST-6", productId: "K9-BD-01", category: "DOGS", unitCostCents: 1850 },
      { itemId: "EST-16", productId: "FL-DLH-02", category: "CATS", unitCostCents: 9350 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "EST-6", locale: "en_US", name: "Male Adult Bulldog", attribute: "Spotted" },
      { itemId: "EST-16", locale: "en_US", name: "Adult Female Persian", attribute: "White" },
    ])
    .onConflictDoNothing()
    .run();
  ownerId = makeAccount("confirmation-owner");
  strangerId = makeAccount("confirmation-stranger");
  const po = toPurchaseOrder(
    ownerId,
    {
      shipper: BILL_TO,
      receiver: SHIP_TO,
      creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2029),
    },
    LINES,
    new Date("2026-09-23T10:15:00.000Z"),
  );
  orderId = withTransaction((tx) => insertPurchaseOrder(tx, po));
});

describe("getOrderConfirmation", () => {
  it("[SWHR3-C-0126] email is the billing email though shipping has another", () => {
    const confirmation = getOrderConfirmation(ownerId, orderId);

    expect(confirmation.email).toBe("sarah.chen@example.com");
    expect(confirmation.shipTo.email).toBe("gift@example.com");
  });

  it("[SWHR3-C-0138] a stored contact reads back with all ten fields", () => {
    const { billTo, shipTo } = getOrderConfirmation(ownerId, orderId);

    expect(billTo).toEqual(BILL_TO);
    expect(billTo.address2).toBeNull();
    expect(shipTo).toEqual(SHIP_TO);
  });

  it("reports id, date, masked card, lines and total", () => {
    const confirmation = getOrderConfirmation(ownerId, orderId);

    expect(confirmation.orderId).toBe(orderId);
    expect(confirmation.orderDate).toBe("2026-09-23T10:15:00.000Z");
    expect(confirmation.card).toEqual({
      cardType: "Java Card",
      last4: "4412",
      expiryDate: "03/2029",
    });
    expect(confirmation.totalCents).toBe(2 * 1850 + 9350);
    expect(confirmation.lines.map((l) => [l.itemId, l.quantity, l.totalCostCents])).toEqual([
      ["EST-6", 2, 3700],
      ["EST-16", 1, 9350],
    ]);
    expect(confirmation.lines[0]).toMatchObject({
      name: "Male Adult Bulldog",
      unitCostCents: 1850,
    });
  });

  it("falls back to the item id as the name when the catalogue no longer has the item", () => {
    const po = toPurchaseOrder(
      ownerId,
      {
        shipper: BILL_TO,
        receiver: SHIP_TO,
        creditCard: createCreditCard("4111111111111111", "Java Card", 1, 2030),
      },
      [{ ...LINES[0], itemId: "GONE-1" }],
    );
    const id = withTransaction((tx) => insertPurchaseOrder(tx, po));

    const [line] = getOrderConfirmation(ownerId, id).lines;

    expect(line).toMatchObject({ itemId: "GONE-1", name: "GONE-1", attribute: "", quantity: 2 });
  });

  it("never exposes the full card number", () => {
    expect(JSON.stringify(getOrderConfirmation(ownerId, orderId))).not.toContain("4111");
  });

  it("throws NotFoundError for another account's order and for a missing order", () => {
    expect(() => getOrderConfirmation(strangerId, orderId)).toThrow(NotFoundError);
    expect(() => getOrderConfirmation(ownerId, 999_999)).toThrow(NotFoundError);
  });
});
