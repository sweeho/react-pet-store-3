import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { cartItems } from "../db/schema";
import { getDetails } from "./cart";

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
