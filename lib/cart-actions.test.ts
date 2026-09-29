import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { getDetails } from "./cart";
import { applyCartAction } from "./cart-actions";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D2/D8/C5: every action runs in one
 * transaction that joins an outer one when given.
 */
afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyCartAction", () => {
  it("dispatches each action type to its cart operation", () => {
    const token = randomUUID();
    applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-1" });
    applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-2", quantity: 3 });
    expect(getDetails(token)).toEqual({ "EST-1": 1, "EST-2": 3 });

    applyCartAction(token, { type: "UPDATE_ITEMS", items: { "EST-1": 4, "EST-2": 0 } });
    expect(getDetails(token)).toEqual({ "EST-1": 4 });

    applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-3" });
    applyCartAction(token, { type: "DELETE_ITEM", itemId: "EST-1" });
    expect(getDetails(token)).toEqual({ "EST-3": 1 });

    applyCartAction(token, { type: "EMPTY" });
    expect(getDetails(token)).toEqual({});
  });

  it("[SWHR3-C-0079] joins an outer transaction instead of starting its own", () => {
    const token = randomUUID();
    const spy = vi.spyOn(db, "transaction");

    withTransaction((tx) => applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-1" }, tx));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(getDetails(token)).toEqual({ "EST-1": 1 });
  });

  it("starts exactly one transaction when standalone", () => {
    const spy = vi.spyOn(db, "transaction");
    applyCartAction(randomUUID(), { type: "UPDATE_ITEMS", items: { "EST-1": 1, "EST-2": 2 } });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("[SWHR3-C-0080] a failing UPDATE_ITEMS batch rolls back entirely", () => {
    const token = randomUUID();
    applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-1" });
    applyCartAction(token, { type: "ADD_ITEM", itemId: "EST-2" });

    // The second entry's non-integer quantity makes updateItemQuantity throw
    // after the first entry has already been written.
    expect(() =>
      applyCartAction(token, { type: "UPDATE_ITEMS", items: { "EST-1": 5, "EST-2": 1.5 } }),
    ).toThrow();

    expect(getDetails(token)).toEqual({ "EST-1": 1, "EST-2": 1 });
  });
});
