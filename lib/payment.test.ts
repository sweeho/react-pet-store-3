import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  orderStageHistory,
  orders,
  paymentAuthorizations,
} from "../db/schema";
import { placeOrder } from "./checkout";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { PaymentDeclinedError } from "./errors";
import {
  DECLINE_TEST_CARD,
  type PaymentAuthorizer,
  authorizePayment,
  noChargeAuthorizer,
} from "./payment";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D2, C4 (order-processing-and-
 * fulfilment): payment goes through a seam whose default never charges.
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
const CARD = createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030);
const DECLINED_CARD = createCreditCard("4000 0000 0000 0002", "Java Card", 3, 2030);

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "payment-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values({ itemId: "PAY-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values({ itemId: "PAY-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function placeOrderAtPending(card = CARD): number {
  const cartToken = randomUUID();
  db.insert(cartItems).values({ sessionToken: cartToken, itemId: "PAY-1", quantity: 2 }).run();
  return placeOrder({
    accountId,
    cartToken,
    locale: "en_US",
    event: { shipper: BILL_TO, receiver: BILL_TO, creditCard: card },
  }).orderId;
}

function stageOf(orderId: number): string | undefined {
  return db.select().from(orders).where(eq(orders.id, orderId)).get()?.workflowStage;
}

function authorizationCount(orderId: number): number {
  return (
    db
      .select({ n: count() })
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.orderId, orderId))
      .get()?.n ?? 0
  );
}

describe("noChargeAuthorizer", () => {
  it("[SWHR3-C-0165] approves without contacting anything", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = noChargeAuthorizer.authorize(
      createCreditCard("4111111111114412", "Java Card", 3, 2030),
      4548,
    );

    expect(result.approved).toBe(true);
    if (result.approved) {
      expect(result.transactionId).toMatch(/^NOCHARGE-/);
      expect(result.authorizationCode).toHaveLength(6);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("declines only the documented test card", () => {
    expect(DECLINE_TEST_CARD).toBe("4000000000000002");
    const result = noChargeAuthorizer.authorize(DECLINED_CARD, 100);
    expect(result.approved).toBe(false);
  });

  it("gives a different transaction id every time", () => {
    const ids = new Set(
      Array.from({ length: 5 }, () => {
        const result = noChargeAuthorizer.authorize(CARD, 100);
        return result.approved ? result.transactionId : "declined";
      }),
    );
    expect(ids.size).toBe(5);
  });
});

describe("authorizePayment", () => {
  it("[SWHR3-C-0164] an approved payment records an authorisation and moves the order to PAID", () => {
    const orderId = placeOrderAtPending();

    withTransaction((tx) => authorizePayment(tx, orderId, CARD, 3998));

    const rows = db
      .select()
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.orderId, orderId))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ processor: "no-charge", amountCents: 3998 });
    expect(rows[0].transactionId).toMatch(/^NOCHARGE-/);
    expect(rows[0].authorizationCode).toHaveLength(6);
    expect(stageOf(orderId)).toBe("PAID");
    const history = db
      .select()
      .from(orderStageHistory)
      .where(eq(orderStageHistory.orderId, orderId))
      .all();
    expect(history.map((h) => h.stage)).toEqual(["PAID"]);
  });

  it("a declined card throws PaymentDeclinedError, writes nothing and leaves the stage PENDING", () => {
    const orderId = placeOrderAtPending(DECLINED_CARD);

    expect(() =>
      withTransaction((tx) => authorizePayment(tx, orderId, DECLINED_CARD, 3998)),
    ).toThrow(PaymentDeclinedError);

    expect(authorizationCount(orderId)).toBe(0);
    expect(stageOf(orderId)).toBe("PENDING");
  });

  it("uses an injected authorizer instead of the default", () => {
    const orderId = placeOrderAtPending();
    const authorizer: PaymentAuthorizer = {
      authorize: vi.fn(() => ({
        approved: true as const,
        transactionId: "FAKE-1",
        authorizationCode: "ABC123",
      })),
    };

    withTransaction((tx) => authorizePayment(tx, orderId, CARD, 3998, authorizer));

    expect(authorizer.authorize).toHaveBeenCalledWith(CARD, 3998);
    const row = db
      .select()
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.orderId, orderId))
      .get();
    expect(row).toMatchObject({ transactionId: "FAKE-1", authorizationCode: "ABC123" });
  });

  it("an injected authorizer can decline any card", () => {
    const orderId = placeOrderAtPending();
    const authorizer: PaymentAuthorizer = {
      authorize: () => ({ approved: false as const, reason: "test" }),
    };

    expect(() =>
      withTransaction((tx) => authorizePayment(tx, orderId, CARD, 3998, authorizer)),
    ).toThrow(PaymentDeclinedError);
    expect(authorizationCount(orderId)).toBe(0);
  });
});
