import { describe, expect, it } from "vitest";

import { ITEM_FIELD_PREFIX, QTY_FIELD_PREFIX, parseInventoryForm } from "./supplier-request";

/**
 * UNIT TEST (server project). design.md D7, C6 (supplier-portal-and-
 * inventory): the flat form body becomes a list of updates; unticked or
 * invalid rows are skipped silently.
 */
describe("parseInventoryForm", () => {
  it("uses the legacy field name prefixes", () => {
    expect(QTY_FIELD_PREFIX).toBe("qty_");
    expect(ITEM_FIELD_PREFIX).toBe("item_");
  });

  it("[SWHR3-C-0195] non-numeric and empty quantities are skipped silently", () => {
    const body = {
      "qty_EST-1": "12",
      "item_EST-1": "on",
      "qty_EST-2": "abc",
      "item_EST-2": "on",
      "qty_EST-3": "",
      "item_EST-3": true,
      "qty_EST-4": "2.5",
      "item_EST-4": "on",
    };

    expect(parseInventoryForm(body)).toEqual([{ itemId: "EST-1", quantity: 12 }]);
  });

  it("[SWHR3-C-0209] a ticked row with 0 is kept", () => {
    expect(parseInventoryForm({ "qty_EST-1": "0", "item_EST-1": "on" })).toEqual([
      { itemId: "EST-1", quantity: 0 },
    ]);
  });

  it("keeps only ticked rows: a quantity with no tick, or a tick with no quantity, is dropped", () => {
    const body = {
      "qty_EST-1": "12",
      "item_EST-1": "on",
      "qty_EST-2": "5",
      "item_EST-3": "on",
    };

    expect(parseInventoryForm(body)).toEqual([{ itemId: "EST-1", quantity: 12 }]);
  });

  it.each([true, "on", "true"])("counts %j as a ticked checkbox", (ticked) => {
    expect(parseInventoryForm({ qty_A: "3", item_A: ticked })).toEqual([
      { itemId: "A", quantity: 3 },
    ]);
  });

  it.each([false, "off", "false", "", "no", 1, null])("does not count %j as ticked", (unticked) => {
    expect(parseInventoryForm({ qty_A: "3", item_A: unticked })).toEqual([]);
  });

  it.each(["-3", "2.5", "abc", "", "   ", "1e3", "0x10", "+4", "١٢"])(
    "skips the invalid quantity %j",
    (quantity) => {
      expect(parseInventoryForm({ qty_A: quantity, item_A: "on" })).toEqual([]);
    },
  );

  it("trims the quantity before checking it", () => {
    expect(parseInventoryForm({ qty_A: " 7 ", item_A: "on" })).toEqual([
      { itemId: "A", quantity: 7 },
    ]);
  });

  it("accepts a whole-number quantity sent as a JSON number, but not a negative or fractional one", () => {
    expect(
      parseInventoryForm({
        qty_A: 4,
        item_A: "on",
        qty_B: -1,
        item_B: "on",
        qty_C: 1.5,
        item_C: "on",
      }),
    ).toEqual([{ itemId: "A", quantity: 4 }]);
  });

  it("skips a quantity too large to be an exact integer", () => {
    expect(parseInventoryForm({ qty_A: "99999999999999999999", item_A: "on" })).toEqual([]);
  });

  it("keeps the order of the ticked rows and every item id, including ones with punctuation", () => {
    const body = {
      "item_EST-2": "on",
      "qty_EST-2": "1",
      "item_EST-10": "on",
      "qty_EST-10": "2",
    };

    expect(parseInventoryForm(body)).toEqual([
      { itemId: "EST-2", quantity: 1 },
      { itemId: "EST-10", quantity: 2 },
    ]);
  });

  it("ignores unrelated fields and an empty item id", () => {
    expect(parseInventoryForm({ other: "x", item_: "on", qty_: "3" })).toEqual([]);
  });

  it.each([null, undefined, "text", 42, []])("returns [] for the non-object body %j", (body) => {
    expect(parseInventoryForm(body)).toEqual([]);
  });
});
