import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { catalogItemDetails, catalogItems } from "../db/schema";
import { getItem } from "./catalog";
import { CatalogItemNotFoundError } from "./errors";

/**
 * UNIT TEST (server project). design.md D3/C4: locale-specific details with
 * an en_US fallback, against the in-memory db.
 */
beforeAll(() => {
  db.insert(catalogItems)
    .values([
      { itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "EST-NODETAIL", productId: "FI-SW-02", category: "FISH", unitCostCents: 100 },
    ])
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "EST-1", locale: "ja_JP", name: "エンゼルフィッシュ", attribute: "大" },
    ])
    .run();
});

describe("getItem", () => {
  it("[SWHR3-C-0077] returns the requested locale's name and attribute", () => {
    expect(getItem("EST-1", "ja_JP")).toEqual({
      itemId: "EST-1",
      productId: "FI-SW-01",
      category: "FISH",
      name: "エンゼルフィッシュ",
      attribute: "大",
      unitCostCents: 1650,
    });
    expect(getItem("EST-1", "en_US").name).toBe("Angelfish");
  });

  it("[SWHR3-C-0077] falls back to en_US for a locale with no details", () => {
    const item = getItem("EST-1", "zh_CN");
    expect(item.name).toBe("Angelfish");
    expect(item.attribute).toBe("Large");
  });

  it("throws CatalogItemNotFoundError for an unknown item", () => {
    expect(() => getItem("NOPE", "en_US")).toThrow(CatalogItemNotFoundError);
  });

  it("throws CatalogItemNotFoundError for an item with no details in any usable locale", () => {
    expect(() => getItem("EST-NODETAIL", "ja_JP")).toThrow(CatalogItemNotFoundError);
  });
});
