import { randomUUID } from "node:crypto";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../../../db/schema";
import { CART_COOKIE_NAME } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import putCart from "./index.put";

/**
 * INTEGRATION TEST (server project). design.md C9: PUT /api/cart.
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

describe("PUT /api/cart", () => {
  it("[SWHR3-C-0051] applies all itemQuantity_ values", async () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-1", quantity: 1 },
        { sessionToken: token, itemId: "EST-2", quantity: 2 },
      ])
      .run();
    const event = new H3Event(
      new Request("http://localhost/api/cart", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: `${CART_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ "itemQuantity_EST-1": "4", "itemQuantity_EST-2": "1" }),
      }),
    );
    await cartSession(event);

    const view = await putCart(event);

    expect(view.items.map((i) => [i.itemId, i.quantity])).toEqual([
      ["EST-1", 4],
      ["EST-2", 1],
    ]);
  });
});
