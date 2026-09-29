import { describe, expect, it } from "vitest";

import {
  ASSIGNABLE_STATUSES,
  ORDER_STATUSES,
  assertTransition,
  isAssignableStatus,
  isOrderStatus,
} from "./order-status";
import type { OrderStatus } from "./order-status";
import { InvalidTransitionError } from "./errors";

/**
 * UNIT TEST (server project)
 *
 * Exercises lib/order-status.ts (design.md D2, C2): the fixed vocabulary,
 * the type guards and every from/to pair assertTransition can be asked
 * about.
 */
describe("ORDER_STATUSES and ASSIGNABLE_STATUSES", () => {
  it("lists exactly PENDING, APPROVED, DENIED, COMPLETED in that order (C2)", () => {
    expect(ORDER_STATUSES).toEqual(["PENDING", "APPROVED", "DENIED", "COMPLETED"]);
  });

  it("lists exactly APPROVED, DENIED as assignable (C2)", () => {
    expect(ASSIGNABLE_STATUSES).toEqual(["APPROVED", "DENIED"]);
  });
});

describe("isOrderStatus", () => {
  it("accepts every value in ORDER_STATUSES", () => {
    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }
  });

  it("rejects an unknown string and a non-string value", () => {
    expect(isOrderStatus("SHIPPED")).toBe(false);
    expect(isOrderStatus(undefined)).toBe(false);
    expect(isOrderStatus(42)).toBe(false);
  });
});

describe("isAssignableStatus", () => {
  it("accepts APPROVED and DENIED only", () => {
    expect(isAssignableStatus("APPROVED")).toBe(true);
    expect(isAssignableStatus("DENIED")).toBe(true);
    expect(isAssignableStatus("PENDING")).toBe(false);
    expect(isAssignableStatus("COMPLETED")).toBe(false);
  });
});

describe("assertTransition", () => {
  const legalPairs = new Set(["PENDING->APPROVED", "PENDING->DENIED"]);

  const allPairs: Array<[OrderStatus, OrderStatus]> = ORDER_STATUSES.flatMap((from) =>
    ORDER_STATUSES.map((to): [OrderStatus, OrderStatus] => [from, to]),
  );

  it.each(allPairs)("from %s to %s (AC-4)", (from, to) => {
    if (legalPairs.has(`${from}->${to}`)) {
      expect(() => assertTransition(1, from, to)).not.toThrow();
    } else {
      expect(() => assertTransition(1, from, to)).toThrow(InvalidTransitionError);
    }
  });

  it("the thrown error names the order id and the current status (AC-4)", () => {
    try {
      assertTransition(99, "COMPLETED", "APPROVED");
      throw new Error("expected assertTransition to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      expect((error as Error).message).toContain("99");
      expect((error as Error).message).toContain("COMPLETED");
    }
  });
});
