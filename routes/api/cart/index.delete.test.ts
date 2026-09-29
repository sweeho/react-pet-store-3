import { randomUUID } from "node:crypto";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { cartItems } from "../../../db/schema";
import { CART_COOKIE_NAME } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import emptyCart from "./index.delete";

/**
 * INTEGRATION TEST (server project). design.md C9: DELETE /api/cart.
 */
describe("DELETE /api/cart", () => {
  it("[SWHR3-C-0075] empties the cart", async () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-1", quantity: 1 },
        { sessionToken: token, itemId: "EST-2", quantity: 2 },
      ])
      .run();
    const event = new H3Event(
      new Request("http://localhost/api/cart", {
        method: "DELETE",
        headers: { cookie: `${CART_COOKIE_NAME}=${token}` },
      }),
    );
    await cartSession(event);

    const view = await emptyCart(event);

    expect(view).toMatchObject({ items: [], count: 0, subtotalCents: 0 });
  });
});
