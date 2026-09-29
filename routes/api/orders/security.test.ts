import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { accounts, cartItems, catalogItemDetails, catalogItems, orders } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { startSession } from "../../../lib/session";
import authMiddleware from "../../../middleware/auth";
import cartSession from "../../../middleware/cart-session";
import postOrder from "./index.post";

/**
 * INTEGRATION TEST (server project). design.md D7, D8, C9, SD10: only a
 * signed-in customer places an order, and it always belongs to the session's
 * account, whatever the body says. Real H3Events through both middlewares.
 */
const YEAR = new Date().getFullYear();

let accountA: number;
let accountB: number;
let cookieA: string;

async function makeAccount(username: string): Promise<{ id: number; cookie: string }> {
  const id = db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  const started = new H3Event(new Request("http://localhost/api/orders"));
  await startSession(started, { id, username });
  const cookie = (
    started.res.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`)) ?? ""
  ).split(";")[0];
  return { id, cookie };
}

beforeAll(async () => {
  ({ id: accountA, cookie: cookieA } = await makeAccount("orders-sec-a"));
  ({ id: accountB } = await makeAccount("orders-sec-b"));
  db.insert(catalogItems)
    .values([{ itemId: "SEC-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 }])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([{ itemId: "SEC-1", locale: "en_US", name: "Angelfish", attribute: "Large" }])
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.useRealTimers();
});

function fillCart(): string {
  const token = randomUUID();
  db.insert(cartItems).values({ sessionToken: token, itemId: "SEC-1", quantity: 2 }).run();
  return token;
}

function address(suffix: "_a" | "_b"): Record<string, string> {
  const base: Record<string, string> = {
    family_name: "Chen",
    given_name: "Sarah",
    address_1: "1247 Larkspur Avenue",
    address_2: "",
    city: "Palo Alto",
    state_or_province: "CA",
    postal_code: "94301",
    country: "United States",
    telephone_number: "+1 650 555 0134",
    email: "sarah.chen@example.com",
  };
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [`${k}${suffix}`, v]));
}

function body(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...address("_a"),
    ...address("_b"),
    credit_card_number: "4111 1111 1111 4412",
    credit_card_type: "Java Card",
    expiration_month: "03",
    expiration_year: String(YEAR + 2),
    ...extra,
  };
}

async function send(
  payload: string,
  contentType: string,
  options: { cartToken: string; cookie?: string },
): Promise<unknown> {
  const cookies = [options.cookie ?? "", `petstore_cart=${options.cartToken}`]
    .filter(Boolean)
    .join("; ");
  const event = new H3Event(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": contentType, cookie: cookies },
      body: payload,
    }),
  );
  await authMiddleware(event);
  await cartSession(event);
  return postOrder(event);
}

const sendJson = (
  payload: Record<string, unknown>,
  options: { cartToken: string; cookie?: string },
) => send(JSON.stringify(payload), "application/json", options);

function orderCount(): number {
  return db.select({ n: count() }).from(orders).get()?.n ?? 0;
}

describe("POST /api/orders security", () => {
  it("[SWHR3-C-0122] the order belongs to the signed-in account", async () => {
    const result = (await sendJson(body(), { cartToken: fillCart(), cookie: cookieA })) as {
      orderId: number;
    };

    const row = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(row?.accountId).toBe(accountA);
  });

  it("[SWHR3-C-0123] an account id in the body is ignored", async () => {
    const result = (await sendJson(body({ accountId: accountB, account_id: accountB }), {
      cartToken: fillCart(),
      cookie: cookieA,
    })) as { orderId: number };

    const row = db.select().from(orders).where(eq(orders.id, result.orderId)).get();
    expect(row?.accountId).toBe(accountA);
  });

  it("[SWHR3-C-0124] a signed-out caller cannot place an order", async () => {
    const before = orderCount();

    await expect(sendJson(body(), { cartToken: fillCart() })).rejects.toMatchObject({
      status: 401,
    });
    expect(orderCount()).toBe(before);
  });

  it("an expired session answers 401 and writes nothing", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    const { cookie } = await makeAccount("orders-sec-expired");
    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z"));
    const before = orderCount();

    await expect(sendJson(body(), { cartToken: fillCart(), cookie })).rejects.toMatchObject({
      status: 401,
    });
    expect(orderCount()).toBe(before);
  });
});
