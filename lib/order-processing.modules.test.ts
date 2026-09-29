import { describe, expect, it } from "vitest";

import * as checkout from "./checkout";
import * as inventory from "./inventory";
import * as notifications from "./notifications";
import * as orderProcessing from "./order-processing";
import * as payment from "./payment";
import * as supplierPos from "./supplier-pos";
import * as workflowStage from "./workflow-stage";

/**
 * UNIT TEST (server project). SD7 (order-processing-and-fulfilment): the
 * legacy ServiceLocator / JNDI lookup has no counterpart. Every collaborator
 * of order processing is a statically imported ES module, so a missing one
 * fails at import time and there is no runtime registry to consult.
 */
describe("order-processing collaborators", () => {
  it("[SWHR3-C-0182] every module loads at import time and exposes its contract functions", () => {
    const contract: Array<[string, Record<string, unknown>, string[]]> = [
      ["lib/checkout", checkout, ["placeOrder", "placeOrderInTx"]],
      ["lib/payment", payment, ["authorizePayment", "noChargeAuthorizer"]],
      ["lib/notifications", notifications, ["queueOrderConfirmation"]],
      [
        "lib/workflow-stage",
        workflowStage,
        ["nextStage", "assertStageTransition", "setWorkflowStage"],
      ],
      ["lib/inventory", inventory, ["reserveInventory", "setInventory"]],
      ["lib/supplier-pos", supplierPos, ["createSupplierPOs", "markPoShipped"]],
      ["lib/order-processing", orderProcessing, ["processOrder"]],
    ];

    for (const [name, mod, exports] of contract) {
      for (const exported of exports) {
        const value = mod[exported];
        // noChargeAuthorizer is an object with an authorize function, the rest are functions.
        expect(
          typeof value === "function" ||
            (typeof value === "object" &&
              value !== null &&
              typeof (value as { authorize?: unknown }).authorize === "function"),
          `${name}.${exported}`,
        ).toBe(true);
      }
    }
  });
});
