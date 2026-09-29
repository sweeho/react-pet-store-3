import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { CART_COOKIE_NAME } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import getCart from "./index.get";

/**
 * INTEGRATION TEST (server project). design.md C9: GET /api/cart.
 */
describe("GET /api/cart", () => {
  it("[SWHR3-C-0056] a first GET answers an empty CartView and sets no cookie", async () => {
    const event = new H3Event(new Request("http://localhost/api/cart"));
    await cartSession(event);

    const view = await getCart(event);

    expect(view).toEqual({ items: [], subtotalCents: 0, count: 0, locale: "en_US" });
    expect(event.res.headers.getSetCookie().some((c) => c.startsWith(`${CART_COOKIE_NAME}=`))).toBe(
      false,
    );
  });
});
