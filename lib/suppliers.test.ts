import { describe, expect, it } from "vitest";

import { DEFAULT_SUPPLIER_ID, SUPPLIER_LEAD_DAYS, supplierForItem } from "./suppliers";

/**
 * UNIT TEST (server project). design.md D6: one supplier today.
 */
describe("suppliers", () => {
  it("every item maps to the default supplier", () => {
    expect(DEFAULT_SUPPLIER_ID).toBe("PETSTORE-SUPPLIER");
    expect(supplierForItem("EST-1")).toBe(DEFAULT_SUPPLIER_ID);
    expect(supplierForItem("anything-else")).toBe(DEFAULT_SUPPLIER_ID);
  });

  it("the lead time is 7 days", () => {
    expect(SUPPLIER_LEAD_DAYS).toBe(7);
  });
});
