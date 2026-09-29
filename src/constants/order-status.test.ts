import { describe, expect, it } from "vitest";

import { ASSIGNABLE_STATUSES, ORDER_STATUSES } from "./order-status";
import {
  ASSIGNABLE_STATUSES as LIB_ASSIGNABLE_STATUSES,
  ORDER_STATUSES as LIB_ORDER_STATUSES,
} from "../../lib/order-status";

/**
 * UNIT TEST (client project)
 *
 * Pins parity between the client mirror and lib/order-status.ts (design.md
 * D2, C2) — the two arrays must never diverge.
 */
describe("src/constants/order-status.ts mirrors lib/order-status.ts (C2)", () => {
  it("ORDER_STATUSES matches", () => {
    expect(ORDER_STATUSES).toEqual(LIB_ORDER_STATUSES);
  });

  it("ASSIGNABLE_STATUSES matches", () => {
    expect(ASSIGNABLE_STATUSES).toEqual(LIB_ASSIGNABLE_STATUSES);
  });
});
