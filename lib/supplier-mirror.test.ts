import { describe, expect, it } from "vitest";

import { SUPPLIER_HOME, SUPPLIER_ROLE_LABEL, SUPPLIER_SIGNIN } from "../src/constants/supplier";
import type { InventoryRow as ClientInventoryRow } from "../src/types/supplier";
import type { InventoryRow } from "./inventory";
import { SUPPLIER_API_PREFIX } from "./protected-resources";

/**
 * UNIT TEST (server project). design.md C11: src/types/supplier.ts mirrors
 * lib/inventory.ts. Parity is checked at type level (each row type must be
 * assignable to the other, so tsc fails if they drift) plus the constants
 * that must agree with the server's supplier prefix.
 */
describe("src/types/supplier.ts parity with lib/", () => {
  it("InventoryRow is mutually assignable with the server's", () => {
    const server: InventoryRow = { itemId: "EST-1", quantity: 4 };
    const client: ClientInventoryRow = server;
    const back: InventoryRow = client;
    expect(back).toEqual({ itemId: "EST-1", quantity: 4 });
  });

  it("the portal paths sit under the server's supplier prefix", () => {
    expect(`${SUPPLIER_HOME}/`).toBe("/supplier/");
    expect(SUPPLIER_SIGNIN.startsWith(`${SUPPLIER_HOME}/`)).toBe(true);
    expect(SUPPLIER_API_PREFIX).toBe("/api/supplier/");
    expect(SUPPLIER_ROLE_LABEL).toBe("Supplier administrator");
  });
});
