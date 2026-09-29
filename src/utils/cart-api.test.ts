import { afterEach, describe, expect, it, vi } from "vitest";

import type { CartView } from "@/types/cart";
import { addToCart, emptyCart, getCart, removeFromCart, updateCart } from "./cart-api";

/**
 * UNIT TEST (client project). design.md C9/C10: one typed binding per cart
 * endpoint, each through apiFetch.
 */
const VIEW: CartView = { items: [], subtotalCents: 0, count: 0, locale: "en_US" };

function stubFetch() {
  const fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(VIEW), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof stubFetch>) {
  const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { path, method: init.method ?? "GET", body: init.body as string | undefined };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cart-api", () => {
  it("getCart GETs /api/cart", async () => {
    const fetchMock = stubFetch();
    expect(await getCart()).toEqual(VIEW);
    expect(lastCall(fetchMock)).toMatchObject({ path: "/api/cart", method: "GET" });
  });

  it("addToCart POSTs the itemId, with quantity only when given", async () => {
    const fetchMock = stubFetch();
    await addToCart("EST-1");
    expect(lastCall(fetchMock)).toMatchObject({ path: "/api/cart", method: "POST" });
    expect(JSON.parse(lastCall(fetchMock).body ?? "")).toEqual({ itemId: "EST-1" });

    const second = stubFetch();
    await addToCart("EST-2", 3);
    expect(JSON.parse(lastCall(second).body ?? "")).toEqual({ itemId: "EST-2", quantity: 3 });
  });

  it("updateCart PUTs the itemQuantity_ fields", async () => {
    const fetchMock = stubFetch();
    await updateCart({ "itemQuantity_EST-1": "4" });
    expect(lastCall(fetchMock)).toMatchObject({ path: "/api/cart", method: "PUT" });
    expect(JSON.parse(lastCall(fetchMock).body ?? "")).toEqual({ "itemQuantity_EST-1": "4" });
  });

  it("removeFromCart DELETEs /api/cart/:itemId with the id encoded", async () => {
    const fetchMock = stubFetch();
    await removeFromCart("EST/1 x");
    expect(lastCall(fetchMock)).toMatchObject({
      path: "/api/cart/EST%2F1%20x",
      method: "DELETE",
    });
  });

  it("emptyCart DELETEs /api/cart", async () => {
    const fetchMock = stubFetch();
    await emptyCart();
    expect(lastCall(fetchMock)).toMatchObject({ path: "/api/cart", method: "DELETE" });
  });
});
