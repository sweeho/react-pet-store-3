import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../db/schema";
import { addItem, deleteItem, getDetails, getItems, updateItemQuantity } from "./cart";
import { ValidationError } from "./errors";

/**
 * UNIT TEST (server project). design.md D1/C2: cart state is cart_items rows
 * keyed by the anonymous cart token.
 */
describe("getDetails", () => {
  it("[SWHR3-C-0055] a new cart token starts with no items", () => {
    expect(getDetails(randomUUID())).toEqual({});
    expect(getDetails(undefined)).toEqual({});
  });

  it("[SWHR3-C-0053] rows written under a token read back on a later call", () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-1", quantity: 1 },
        { sessionToken: token, itemId: "EST-2", quantity: 2 },
      ])
      .run();

    expect(getDetails(token)).toEqual({ "EST-1": 1, "EST-2": 2 });
  });

  it("two tokens never see each other's rows, and the result is a fresh object", () => {
    const a = randomUUID();
    const b = randomUUID();
    db.insert(cartItems).values({ sessionToken: a, itemId: "EST-1", quantity: 3 }).run();

    expect(getDetails(b)).toEqual({});
    const first = getDetails(a);
    first["EST-9"] = 9;
    expect(getDetails(a)).toEqual({ "EST-1": 3 });
  });
});

describe("addItem", () => {
  it("[SWHR3-C-0057] adding an item without a quantity stores quantity 1", () => {
    const token = randomUUID();
    addItem(token, "EST-1");
    expect(getDetails(token)).toEqual({ "EST-1": 1 });
  });

  it("[SWHR3-C-0059] adding an item with quantity 4 stores 4", () => {
    const token = randomUUID();
    addItem(token, "EST-2", 4);
    expect(getDetails(token)).toEqual({ "EST-2": 4 });
  });

  it("re-adding an item sets its quantity rather than incrementing it (D5, SD10)", () => {
    const token = randomUUID();
    addItem(token, "EST-1", 2);
    addItem(token, "EST-1", 5);
    expect(getDetails(token)).toEqual({ "EST-1": 5 });
  });

  it("[SWHR3-C-0060] rejects a quantity that is not a positive integer", () => {
    const token = randomUUID();
    for (const quantity of [0, -1, 1.5]) {
      let caught: unknown;
      try {
        addItem(token, "EST-1", quantity);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ValidationError);
      expect((caught as ValidationError).fieldErrors).toHaveProperty("quantity");
    }
    expect(getDetails(token)).toEqual({});
  });

  it("writes nothing for an undefined token", () => {
    expect(() => addItem(undefined, "EST-1")).not.toThrow();
    expect(getDetails(undefined)).toEqual({});
  });
});

describe("deleteItem", () => {
  it("[SWHR3-C-0061] removes only the named item", () => {
    const token = randomUUID();
    addItem(token, "EST-1", 1);
    addItem(token, "EST-2", 2);
    deleteItem(token, "EST-1");
    expect(getDetails(token)).toEqual({ "EST-2": 2 });
  });

  it("is a no-op when the item is absent", () => {
    const token = randomUUID();
    addItem(token, "EST-1");
    expect(() => deleteItem(token, "EST-9")).not.toThrow();
    expect(() => deleteItem(undefined, "EST-1")).not.toThrow();
    expect(getDetails(token)).toEqual({ "EST-1": 1 });
  });

  it("leaves another token's identical item untouched", () => {
    const a = randomUUID();
    const b = randomUUID();
    addItem(a, "EST-1", 3);
    addItem(b, "EST-1", 4);
    deleteItem(a, "EST-1");
    expect(getDetails(a)).toEqual({});
    expect(getDetails(b)).toEqual({ "EST-1": 4 });
  });
});

describe("updateItemQuantity", () => {
  it.each([
    ["[SWHR3-C-0063] a positive quantity is stored", 3, { "EST-1": 3, "EST-2": 2 }],
    ["[SWHR3-C-0064] zero removes the item", 0, { "EST-2": 2 }],
    ["[SWHR3-C-0065] a negative quantity removes the item", -2, { "EST-2": 2 }],
  ])("%s", (_title, quantity, expected) => {
    const token = randomUUID();
    addItem(token, "EST-1", 1);
    addItem(token, "EST-2", 2);
    updateItemQuantity(token, "EST-1", quantity);
    expect(getDetails(token)).toEqual(expected);
  });

  it("a positive quantity for an absent item adds it (SD14)", () => {
    const token = randomUUID();
    updateItemQuantity(token, "EST-1", 4);
    expect(getDetails(token)).toEqual({ "EST-1": 4 });
  });

  it("writes nothing for an undefined token", () => {
    expect(() => updateItemQuantity(undefined, "EST-1", 2)).not.toThrow();
    expect(getDetails(undefined)).toEqual({});
  });
});

describe("getItems", () => {
  beforeAll(() => {
    db.insert(catalogItems)
      .values({ itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 })
      .onConflictDoNothing()
      .run();
    db.insert(catalogItemDetails)
      .values({ itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
      .onConflictDoNothing()
      .run();
  });

  it("[SWHR3-C-0069] returns CartItems carrying catalogue details", () => {
    const token = randomUUID();
    db.insert(cartItems).values({ sessionToken: token, itemId: "EST-1", quantity: 2 }).run();

    expect(getItems(token)).toEqual([
      {
        itemId: "EST-1",
        productId: "FI-SW-01",
        category: "FISH",
        name: "Angelfish",
        attribute: "Large",
        quantity: 2,
        unitCostCents: 1650,
      },
    ]);
  });

  it("[SWHR3-C-0070] an item missing from the catalogue is logged and skipped", () => {
    const token = randomUUID();
    db.insert(cartItems)
      .values([
        { sessionToken: token, itemId: "EST-1", quantity: 1 },
        { sessionToken: token, itemId: "GHOST-1", quantity: 4 },
      ])
      .run();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const items = getItems(token);
      expect(items.map((i) => i.itemId)).toEqual(["EST-1"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("GHOST-1"));
    } finally {
      warn.mockRestore();
    }
  });

  it("returns an empty list for an undefined token", () => {
    expect(getItems(undefined)).toEqual([]);
  });
});
