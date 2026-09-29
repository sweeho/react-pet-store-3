import { describe, expect, it } from "vitest";

import { InvalidTransitionError } from "./errors";
import {
  SUPPLIER_ORDER_STATUSES,
  type SupplierOrderStatus,
  assertSupplierOrderTransition,
} from "./supplier-order-status";

/**
 * UNIT TEST (server project). design.md D2, C2 (supplier-portal-and-
 * inventory): a supplier PO moves PENDING -> PROCESSING -> COMPLETED only.
 */
const LEGAL = new Set(["PENDING>PROCESSING", "PROCESSING>COMPLETED"]);

describe("supplier order status", () => {
  it("lists the three statuses in lifecycle order", () => {
    expect([...SUPPLIER_ORDER_STATUSES]).toEqual(["PENDING", "PROCESSING", "COMPLETED"]);
  });

  const pairs = SUPPLIER_ORDER_STATUSES.flatMap((from) =>
    SUPPLIER_ORDER_STATUSES.map((to): [SupplierOrderStatus, SupplierOrderStatus] => [from, to]),
  );

  it.each(pairs)("[SWHR3-C-0198] %s -> %s is legal only along the lifecycle", (from, to) => {
    const call = () => assertSupplierOrderTransition(1, from, to);
    if (LEGAL.has(`${from}>${to}`)) {
      expect(call).not.toThrow();
    } else {
      expect(call).toThrow(InvalidTransitionError);
    }
  });

  it("[SWHR3-C-0198] exactly two of the nine pairs are legal", () => {
    const legal = pairs.filter(([from, to]) => {
      try {
        assertSupplierOrderTransition(1, from, to);
        return true;
      } catch {
        return false;
      }
    });
    expect(legal).toEqual([
      ["PENDING", "PROCESSING"],
      ["PROCESSING", "COMPLETED"],
    ]);
  });
});
