import { describe, expect, it } from "vitest";
import {
  cartItemTotalCost,
  cartItemTotalCostCents,
  cartItemUnitCost,
  createCartItem,
  type CartItem,
  type CatalogItem,
} from "./cart-item";

describe("CartItem value object", () => {
  it("[SWHR3-C-0083] createCartItem carries all seven display fields", () => {
    const catalogItem: CatalogItem = {
      itemId: "EST-1",
      productId: "FI-SW-01",
      category: "FISH",
      name: "Angelfish",
      attribute: "Large",
      unitCostCents: 1650,
    };
    const item = createCartItem(catalogItem, 2);
    expect(item).toEqual({
      itemId: "EST-1",
      productId: "FI-SW-01",
      category: "FISH",
      name: "Angelfish",
      attribute: "Large",
      quantity: 2,
      unitCostCents: 1650,
    });
    expect(cartItemUnitCost(item)).toBe(16.5);
  });

  it("[SWHR3-C-0084] total cost of 5 at 19.99 is exactly 99.95", () => {
    const item: CartItem = {
      itemId: "EST-2",
      productId: "FI-SW-02",
      category: "FISH",
      name: "Goldfish",
      attribute: "Small",
      quantity: 5,
      unitCostCents: 1999,
    };
    expect(cartItemTotalCost(item)).toBe(99.95);
    expect(cartItemTotalCostCents(item)).toBe(9995);
  });
});
