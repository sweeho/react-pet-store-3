import { describe, expect, it } from "vitest";

import {
  parseAddRequest,
  parseQuantity,
  parseRemoveRequest,
  parseUpdateRequest,
} from "./cart-request";
import { ValidationError } from "./errors";

/**
 * UNIT TEST (server project). design.md C6: HTTP request -> CartAction.
 */
describe("parseAddRequest", () => {
  it("[SWHR3-C-0085] an add request becomes an ADD_ITEM action", () => {
    expect(parseAddRequest({ itemId: "EST-1" })).toEqual({ type: "ADD_ITEM", itemId: "EST-1" });
    expect(parseAddRequest({ itemId: "EST-1", quantity: "3" })).toEqual({
      type: "ADD_ITEM",
      itemId: "EST-1",
      quantity: 3,
    });
  });

  it.each([undefined, null, {}, { itemId: "" }, { itemId: "  " }, { itemId: 5 }])(
    "a missing or blank itemId is refused: %j",
    (body) => {
      expect(() => parseAddRequest(body)).toThrow(ValidationError);
    },
  );
});

describe("parseRemoveRequest", () => {
  it("[SWHR3-C-0087] a remove request becomes a DELETE_ITEM action", () => {
    expect(parseRemoveRequest("EST-1")).toEqual({ type: "DELETE_ITEM", itemId: "EST-1" });
    try {
      parseRemoveRequest(" ");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty("itemId");
    }
    expect(() => parseRemoveRequest(undefined)).toThrow(ValidationError);
  });
});

describe("parseUpdateRequest", () => {
  it("[SWHR3-C-0088] collects every itemQuantity_ field into UPDATE_ITEMS", () => {
    expect(
      parseUpdateRequest({
        "itemQuantity_EST-1": "2",
        "itemQuantity_EST-2": "0",
        other: "x",
      }),
    ).toEqual({ type: "UPDATE_ITEMS", items: { "EST-1": 2, "EST-2": 0 } });
  });

  it("a bare prefix with no itemId is refused", () => {
    expect(() => parseUpdateRequest({ itemQuantity_: "1" })).toThrow(ValidationError);
  });
});

describe("parseQuantity", () => {
  it.each(["abc", "2.5", "", " 3 ", null, 4.2])("[SWHR3-C-0089] %j parses to 0", (value) => {
    expect(parseQuantity(value)).toBe(0);
  });

  it.each([
    ["7", 7],
    ["-1", -1],
    [7, 7],
  ])("[SWHR3-C-0089] %j parses to %d", (value, expected) => {
    expect(parseQuantity(value)).toBe(expected);
  });
});
