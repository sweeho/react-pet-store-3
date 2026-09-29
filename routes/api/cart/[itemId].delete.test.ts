import { randomUUID } from "node:crypto";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../../../db/schema";
import { CART_COOKIE_NAME } from "../../../lib/cart";
import cartSession from "../../../middleware/cart-session";
import deleteItem from "./[itemId].delete";

/**
 * INTEGRATION TEST (server project). design.md C9: DELETE /api/cart/:itemId.
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

describe("DELETE /api/cart/:itemId", () => {
  it("[SWHR3-C-0062] removes that item", async () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-1", quantity: 1 },
        { sessionToken: token, itemId: "EST-2", quantity: 2 },
      ])
      .run();
    const event = new H3Event(
      new Request("http://localhost/api/cart/EST-1", {
        method: "DELETE",
        headers: { cookie: `${CART_COOKIE_NAME}=${token}` },
      }),
    );
    event.context.params = { itemId: "EST-1" };
    await cartSession(event);

    const view = await deleteItem(event);

    expect(view.items.map((i) => i.itemId)).toEqual(["EST-2"]);
    expect(view.count).toBe(1);
  });
});
