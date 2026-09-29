import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { cartItems } from "../db/schema";
import { addItem, deleteItem, getDetails } from "./cart";
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
