import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import type { CartItem } from "../../../lib/cart-item";
import type { ContactInfo } from "../../../lib/contact-info";
import { createCreditCard } from "../../../lib/credit-card";
import { insertPurchaseOrder, toPurchaseOrder } from "../../../lib/purchase-orders";
import { startSession } from "../../../lib/session";
import { withTransaction } from "../../../lib/transaction";
import getOrderRoute from "./[id].get";

/**
 * INTEGRATION TEST (server project). design.md C9, D7: GET /api/orders/:id
 * answers the owner's confirmation, 404 for anyone else's, 401 signed out.
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
const LINES: CartItem[] = [
  {
    itemId: "EST-6",
    productId: "K9-BD-01",
    category: "DOGS",
    name: "Bulldog",
    attribute: "Adult",
    quantity: 1,
    unitCostCents: 1850,
  },
];

let ownerCookie: string;
let strangerCookie: string;
let orderId: number;

async function signIn(username: string): Promise<{ id: number; cookie: string }> {
  const id = db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  const started = new H3Event(new Request("http://localhost/api/orders/1"));
  await startSession(started, { id, username });
  const cookie = (
    started.res.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`)) ?? ""
  ).split(";")[0];
  return { id, cookie };
}

beforeAll(async () => {
  const owner = await signIn("order-get-owner");
  ownerCookie = owner.cookie;
  strangerCookie = (await signIn("order-get-stranger")).cookie;
  const po = toPurchaseOrder(
    owner.id,
    {
      shipper: BILL_TO,
      receiver: { ...BILL_TO, email: "gift@example.com" },
      creditCard: createCreditCard("4111 1111 1111 4412", "Meow Card", 3, 2029),
    },
    LINES,
  );
  orderId = withTransaction((tx) => insertPurchaseOrder(tx, po));
});

function makeEvent(id: string, cookie?: string): H3Event {
  const event = new H3Event(
    new Request(`http://localhost/api/orders/${id}`, cookie ? { headers: { cookie } } : undefined),
  );
  event.context.params = { id };
  return event;
}

describe("GET /api/orders/:id", () => {
  it("[SWHR3-C-0126] answers the owner's confirmation with the billing email", async () => {
    const result = (await getOrderRoute(makeEvent(String(orderId), ownerCookie))) as {
      orderId: number;
      email: string;
      card: { last4: string };
    };

    expect(result.orderId).toBe(orderId);
    expect(result.email).toBe("sarah.chen@example.com");
    expect(result.card.last4).toBe("4412");
  });

  it("answers 404 for another account's order", async () => {
    await expect(getOrderRoute(makeEvent(String(orderId), strangerCookie))).rejects.toMatchObject({
      status: 404,
    });
  });

  it("answers 404 for an unknown id and for a non-integer id", async () => {
    await expect(getOrderRoute(makeEvent("999999", ownerCookie))).rejects.toMatchObject({
      status: 404,
    });
    await expect(getOrderRoute(makeEvent("abc", ownerCookie))).rejects.toMatchObject({
      status: 404,
    });
    await expect(getOrderRoute(makeEvent("1.5", ownerCookie))).rejects.toMatchObject({
      status: 404,
    });
  });

  it("answers 401 signed out", async () => {
    await expect(getOrderRoute(makeEvent(String(orderId)))).rejects.toMatchObject({ status: 401 });
  });
});
