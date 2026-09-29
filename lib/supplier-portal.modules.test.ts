import { describe, expect, it } from "vitest";

import * as inventory from "./inventory";
import * as inventoryUpdate from "./inventory-update";
import * as invoices from "./invoices";
import * as supplierFulfilment from "./supplier-fulfilment";
import * as supplierOrders from "./supplier-orders";

/**
 * UNIT TEST (server project). SD8 (supplier-portal-and-inventory): the legacy
 * ServiceLocator / JNDI lookup has no counterpart. Every collaborator of the
 * supplier portal is a statically imported ES module, so a missing one fails
 * at import time and there is no runtime registry to consult.
 */
describe("supplier-portal collaborators", () => {
  it("[SWHR3-C-0226] every module loads at import time and exposes its contract functions", () => {
    const contract: Array<[string, Record<string, unknown>, string[]]> = [
      ["lib/inventory", inventory, ["getInventory", "getInventoryItem", "updateQuantity"]],
      ["lib/inventory-update", inventoryUpdate, ["applyInventoryUpdate"]],
      [
        "lib/supplier-fulfilment",
        supplierFulfilment,
        ["fulfilSupplierOrder", "processPendingSupplierOrders"],
      ],
      ["lib/invoices", invoices, ["generateInvoice", "receiveInvoice", "getInvoice"]],
      [
        "lib/supplier-orders",
        supplierOrders,
        ["getSupplierOrder", "listSupplierOrders", "deleteSupplierOrder"],
      ],
    ];

    for (const [name, mod, exports] of contract) {
      for (const exported of exports) {
        expect(typeof mod[exported], `${name}.${exported}`).toBe("function");
      }
    }
  });
});
