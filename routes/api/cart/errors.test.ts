import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../../../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../../../db/schema";
import { CART_COOKIE_NAME, addItem } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import deleteItemRoute from "./[itemId].delete";
import getCart from "./index.get";
import postCart from "./index.post";
import putCart from "./index.put";

/**
 * INTEGRATION TEST (server project). The cart's failure paths at the HTTP
 * level (design.md D4, C6, C8, C9, SD11, SD12), through the cart-session
 * middleware and the real handlers.
 */
beforeAll(() => {
  db.insert(catalogItems)
    .values([
      { itemId: "ERR-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "ERR-2", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "ERR-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "ERR-2", locale: "en_US", name: "Angelfish", attribute: "Small" },
    ])
    .onConflictDoNothing()
    .run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function makeEvent(
  method: string,
  path: string,
  options: {
    token?: string;
    rawCookie?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): Promise<H3Event> {
  const cookie = options.rawCookie ?? (options.token ? `${CART_COOKIE_NAME}=${options.token}` : "");
  const event = new H3Event(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(cookie ? { cookie } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );
  if (options.params) {
    event.context.params = options.params;
  }
  await cartSession(event);
  return event;
}

function seed(token: string, rows: Array<[string, number]>) {
  db.insert(cartItems)
    .values(rows.map(([itemId, quantity]) => ({ sessionToken: token, itemId, quantity })))
    .run();
}

describe("cart error handling", () => {
  it("[SWHR3-C-0096] a non-numeric quantity removes that item only", async () => {
    const token = randomUUID();
    seed(token, [
      ["ERR-1", 2],
      ["ERR-2", 1],
    ]);
    const event = await makeEvent("PUT", "/api/cart", {
      token,
      body: { "itemQuantity_ERR-1": "abc", "itemQuantity_ERR-2": "1" },
    });

    const view = await putCart(event);

    expect(view.items.map((i) => [i.itemId, i.quantity])).toEqual([["ERR-2", 1]]);
  });

  it.each(["abc", "2.5", ""])("PUT with quantity %j removes that item", async (value) => {
    const token = randomUUID();
    seed(token, [
      ["ERR-1", 2],
      ["ERR-2", 3],
    ]);
    const event = await makeEvent("PUT", "/api/cart", {
      token,
      body: { "itemQuantity_ERR-1": value },
    });

    const view = await putCart(event);

    expect(view.items.map((i) => [i.itemId, i.quantity])).toEqual([["ERR-2", 3]]);
  });

  it("POST without itemId answers 422 VALIDATION_FAILED with fieldErrors.itemId", async () => {
    const event = await makeEvent("POST", "/api/cart", { body: {} });

    await expect(postCart(event)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { itemId: expect.any(String) } },
    });
  });

  it("DELETE /api/cart/%20 answers 422", async () => {
    const event = await makeEvent("DELETE", "/api/cart/%20", { params: { itemId: "%20" } });
    // Router params arrive decoded; a blank id is refused either way.
    event.context.params = { itemId: " " };

    // The delete handler is synchronous, so it throws rather than rejects.
    expect(() => deleteItemRoute(event)).toThrowError(
      expect.objectContaining({
        status: 422,
        data: { code: "VALIDATION_FAILED", fieldErrors: { itemId: expect.any(String) } },
      }),
    );
  });

  it("POST of an unknown itemId answers 404 CATALOG_ITEM_NOT_FOUND", async () => {
    const event = await makeEvent("POST", "/api/cart", { body: { itemId: "NOPE-9" } });

    await expect(postCart(event)).rejects.toMatchObject({
      status: 404,
      data: { code: "CATALOG_ITEM_NOT_FOUND" },
    });
  });

  it("[SWHR3-C-0071] GET omits a line whose catalogue item was deleted", async () => {
    db.insert(catalogItems)
      .values({ itemId: "ERR-GONE", productId: "FI-SW-01", category: "FISH", unitCostCents: 100 })
      .onConflictDoNothing()
      .run();
    db.insert(catalogItemDetails)
      .values({ itemId: "ERR-GONE", locale: "en_US", name: "Gone", attribute: "x" })
      .onConflictDoNothing()
      .run();
    const token = randomUUID();
    seed(token, [
      ["ERR-1", 1],
      ["ERR-GONE", 2],
    ]);
    db.delete(catalogItemDetails).where(eq(catalogItemDetails.itemId, "ERR-GONE")).run();
    db.delete(catalogItems).where(eq(catalogItems.itemId, "ERR-GONE")).run();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const view = await getCart(await makeEvent("GET", "/api/cart", { token }));

    expect(view.items.map((i) => i.itemId)).toEqual(["ERR-1"]);
  });

  it("GET with no cookie answers an empty CartView and sets no cookie", async () => {
    const event = await makeEvent("GET", "/api/cart");

    const view = await getCart(event);

    expect(view).toMatchObject({ items: [], count: 0, subtotalCents: 0 });
    expect(event.res.headers.getSetCookie()).toEqual([]);
  });

  it("GET with a malformed cookie reads empty", async () => {
    const event = await makeEvent("GET", "/api/cart", { rawCookie: `${CART_COOKIE_NAME}=garbage` });

    const view = await getCart(event);

    expect(view.items).toEqual([]);
    expect(event.res.headers.getSetCookie()).toEqual([]);
  });

  it("twenty concurrent adds of one item on one token leave exactly one row", async () => {
    const token = randomUUID();

    await Promise.all(
      Array.from({ length: 20 }, () => Promise.resolve().then(() => addItem(token, "ERR-1", 1))),
    );

    const rows = db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.sessionToken, token), eq(cartItems.itemId, "ERR-1")))
      .all();
    expect(rows).toHaveLength(1);
  });
});
