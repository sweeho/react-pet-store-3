import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

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
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { processOrder } from "./order-processing";

/**
 * UNIT TEST (server project). design.md D3, C8: ten concurrent placements
 * each keep their own customer, and each gets exactly one payment row and
 * one outbox row. Proof only: no production file changes.
 */
const COUNT = 10;

let accountIds: number[];

beforeAll(() => {
  db.insert(catalogItems)
    .values({ itemId: "CC-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values({ itemId: "CC-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
    .onConflictDoNothing()
    .run();
  accountIds = Array.from(
    { length: COUNT },
    (_, i) =>
      db
        .insert(accounts)
        .values({ username: `concurrent-user-${i}`, passwordHash: "not-a-real-hash" })
        .returning({ id: accounts.id })
        .get().id,
  );
});

function billTo(i: number): ContactInfo {
  return {
    familyName: `Family${i}`,
    givenName: "Sarah",
    address1: "1 Main St",
    address2: null,
    city: "Palo Alto",
    stateOrProvince: "CA",
    postalCode: "94301",
    country: "USA",
    telephoneNumber: "555-0100",
    email: `customer${i}@example.com`,
  };
}

describe("processOrder concurrency", () => {
  it("[SWHR3-C-0184] ten concurrent placements each keep their own customer", async () => {
    const placements = accountIds.map((accountId, i) => {
      const cartToken = randomUUID();
      db.insert(cartItems).values({ sessionToken: cartToken, itemId: "CC-1", quantity: 1 }).run();
      const event = {
        shipper: billTo(i),
        receiver: { ...billTo(i), givenName: "Gift" },
        creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
      };
      return async () => processOrder({ accountId, cartToken, locale: "en_US", event });
    });

    const results = await Promise.all(placements.map((place) => place()));

    const ids = results.map((r) => r.orderId);
    expect(new Set(ids).size).toBe(COUNT);
    const rows = db.select().from(orders).where(inArray(orders.id, ids)).all();
    expect(rows).toHaveLength(COUNT);
    results.forEach((result, i) => {
      const row = rows.find((r) => r.id === result.orderId);
      expect(row?.accountId).toBe(accountIds[i]);
      expect(row?.email).toBe(`customer${i}@example.com`);
      expect(
        db
          .select()
          .from(paymentAuthorizations)
          .where(eq(paymentAuthorizations.orderId, result.orderId))
          .all(),
      ).toHaveLength(1);
      expect(
        db
          .select()
          .from(notificationOutbox)
          .where(eq(notificationOutbox.orderId, result.orderId))
          .all(),
      ).toHaveLength(1);
    });
  });
});
