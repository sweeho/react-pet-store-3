import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { catalogItemDetails, catalogItems } from "../../../db/schema";
import { CART_COOKIE_NAME } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import getCart from "./index.get";
import postCart from "./index.post";

/**
 * INTEGRATION TEST (server project). design.md C9: POST /api/cart, run
 * through the cart-session middleware as a real request would be.
 */
beforeAll(() => {
  db.insert(catalogItems)
    .values([
      { itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "EST-2", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "EST-2", locale: "en_US", name: "Angelfish", attribute: "Small" },
    ])
    .onConflictDoNothing()
    .run();
});

function makeEvent(method: string, body?: unknown, cookie?: string): H3Event {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  return new H3Event(
    new Request("http://localhost/api/cart", {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

function setCookie(event: H3Event): string | undefined {
  return event.res.headers.getSetCookie().find((c) => c.startsWith(`${CART_COOKIE_NAME}=`));
}

async function post(body: unknown, cookie?: string) {
  const event = makeEvent("POST", body, cookie);
  await cartSession(event);
  const view = await postCart(event);
  return { event, view };
}

describe("POST /api/cart", () => {
  it("[SWHR3-C-0058] with only itemId adds quantity 1", async () => {
    const { view } = await post({ itemId: "EST-1" });

    expect(view.items).toHaveLength(1);
    expect(view.items[0]).toMatchObject({ itemId: "EST-1", quantity: 1, totalCostCents: 1650 });
    expect(view.subtotalCents).toBe(1650);
  });

  it("[SWHR3-C-0056] the first write mints an httpOnly UUID cart cookie", async () => {
    const { event } = await post({ itemId: "EST-1" });

    const cookie = setCookie(event);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(
      /petstore_cart=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it("[SWHR3-C-0053] items added in one request are still there on a later request", async () => {
    const first = await post({ itemId: "EST-1" });
    const pair = setCookie(first.event)?.split(";")[0] ?? "";
    await post({ itemId: "EST-2", quantity: 2 }, pair);

    const getEvent = makeEvent("GET", undefined, pair);
    await cartSession(getEvent);
    const view = await getCart(getEvent);

    expect(view.count).toBe(2);
    expect(view.items.map((i) => [i.itemId, i.quantity])).toEqual([
      ["EST-1", 1],
      ["EST-2", 2],
    ]);
  });

  it("[SWHR3-C-0086] without itemId is refused with 422 VALIDATION_FAILED", async () => {
    await expect(post({})).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { itemId: expect.any(String) } },
    });
  });

  it("an item the catalogue does not have answers 404 CATALOG_ITEM_NOT_FOUND", async () => {
    await expect(post({ itemId: "GHOST-1" })).rejects.toMatchObject({
      status: 404,
      data: { code: "CATALOG_ITEM_NOT_FOUND" },
    });
  });
});
