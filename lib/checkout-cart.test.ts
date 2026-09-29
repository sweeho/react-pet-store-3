import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../db/schema";
import { getCheckoutLines } from "./checkout-cart";
import { ShoppingCartEmptyError } from "./errors";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md C7: the checkout's view of the
 * cart, refusing one with no enrichable lines.
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

function lines(token: string | undefined) {
  return withTransaction((tx) => getCheckoutLines(token, "en_US", tx));
}

describe("getCheckoutLines", () => {
  it("returns the enriched lines in insertion order", () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-2", quantity: 1 },
        { sessionToken: token, itemId: "EST-1", quantity: 3 },
      ])
      .run();

    expect(lines(token).map((l) => [l.itemId, l.quantity, l.name])).toEqual([
      ["EST-2", 1, "Angelfish"],
      ["EST-1", 3, "Angelfish"],
    ]);
  });

  it("[SWHR3-C-0115] an empty cart throws ShoppingCartEmptyError", () => {
    const ghostOnly = randomUUID();
    db.insert(cartItems).values({ sessionToken: ghostOnly, itemId: "GHOST-1", quantity: 1 }).run();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      for (const token of [randomUUID(), ghostOnly, undefined]) {
        expect(() => lines(token)).toThrow(ShoppingCartEmptyError);
        expect(() => lines(token)).toThrow("Shopping cart is empty");
      }
    } finally {
      warn.mockRestore();
    }
  });
});
