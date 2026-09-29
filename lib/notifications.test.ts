import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  notificationOutbox,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { InvalidTransitionError } from "./errors";
import { ORDER_CONFIRMATION, queueOrderConfirmation } from "./notifications";
import { getOrderRecord } from "./order-records";
import { withTransaction } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

/**
 * UNIT TEST (server project). design.md D4, C5: "queued" is an outbox row,
 * written when the order moves from PAID to CONFIRMED.
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
  receiver: { ...BILL_TO, givenName: "Gift", city: "San Francisco", email: "gift@example.com" },
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "notifications-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values([
      { itemId: "NTF-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 },
      { itemId: "NTF-2", productId: "K9-BD-01", category: "DOGS", unitCostCents: 550 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "NTF-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "NTF-2", locale: "en_US", name: "Bulldog", attribute: "Male" },
    ])
    .onConflictDoNothing()
    .run();
});

function place(): number {
  const cartToken = randomUUID();
  db.insert(cartItems)
    .values([
      { sessionToken: cartToken, itemId: "NTF-1", quantity: 2 },
      { sessionToken: cartToken, itemId: "NTF-2", quantity: 1 },
    ])
    .run();
  return placeOrder({ accountId, cartToken, locale: "en_US", event: EVENT }).orderId;
}

function outboxRows(orderId: number) {
  return db.select().from(notificationOutbox).where(eq(notificationOutbox.orderId, orderId)).all();
}

describe("queueOrderConfirmation", () => {
  it("[SWHR3-C-0171] a paid order queues one confirmation with details, total and ship-to", () => {
    const orderId = place();
    withTransaction((tx) => setWorkflowStage(tx, orderId, "PAID"));

    const outboxId = withTransaction((tx) => queueOrderConfirmation(tx, orderId));

    const rows = outboxRows(orderId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: outboxId,
      kind: ORDER_CONFIRMATION,
      status: "QUEUED",
      recipient: "sarah.chen@example.com",
    });
    const payload = JSON.parse(rows[0].payload);
    expect(payload).toMatchObject({
      orderId,
      email: "sarah.chen@example.com",
      totalCents: 4548,
    });
    expect(payload.lines).toEqual([
      { itemId: "NTF-1", name: "Angelfish", quantity: 2, lineTotalCents: 3998 },
      { itemId: "NTF-2", name: "Bulldog", quantity: 1, lineTotalCents: 550 },
    ]);
    expect(payload.shipTo).toMatchObject({ city: "San Francisco", givenName: "Gift" });
    expect(payload.shipTo).not.toHaveProperty("orderId");
    expect(payload.shipTo).not.toHaveProperty("role");
    expect(getOrderRecord(orderId).order.workflowStage).toBe("CONFIRMED");
  });

  it("an order that is not PAID throws and writes nothing", () => {
    const orderId = place();
    const before = db.select({ n: count() }).from(notificationOutbox).get()?.n;

    expect(() => withTransaction((tx) => queueOrderConfirmation(tx, orderId))).toThrow(
      InvalidTransitionError,
    );

    expect(db.select({ n: count() }).from(notificationOutbox).get()?.n).toBe(before);
    expect(outboxRows(orderId)).toEqual([]);
    expect(getOrderRecord(orderId).order.workflowStage).toBe("PENDING");
  });
});
