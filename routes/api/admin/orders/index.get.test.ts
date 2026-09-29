import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { accounts, orders } from "../../../../db/schema";
import type { OrderStatus } from "../../../../lib/order-status";
import getAdminOrders from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Real-H3Event pattern (see routes/api/users/index.get.test.ts). Covers
 * design.md C6: GET /api/admin/orders answers 200 { orders } with all four
 * ORDER_STATUSES keys, each an OrderRow array (empty when a status has no
 * rows). Admin-only enforcement (D4) is out of this ticket's scope (a
 * different ticket owns middleware/auth.ts), so no session is set up here.
 */
function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

function insertOrder(
  accountId: number,
  overrides: { status?: OrderStatus; orderDate?: Date } = {},
) {
  return db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alice Anderson",
      orderDate: overrides.orderDate ?? new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1999,
      status: overrides.status ?? "PENDING",
    })
    .returning()
    .get();
}

function makeEvent(): H3Event {
  return new H3Event(new Request("http://localhost/api/admin/orders"));
}

// getOrdersGroupedByStatus scans every order in the db (no per-account
// filter), so each test starts from an empty orders table.
beforeEach(() => {
  db.delete(orders).run();
});

describe("GET /api/admin/orders", () => {
  it("[SWHR3-C-0034] returns all four status groups in one response, each seeded order exactly once", async () => {
    const account = makeAccount("admin-orders-route-1");
    const pending = insertOrder(account.id, { status: "PENDING" });
    const approved = insertOrder(account.id, { status: "APPROVED" });
    const denied = insertOrder(account.id, { status: "DENIED" });
    const completed = insertOrder(account.id, { status: "COMPLETED" });

    const result = (await getAdminOrders(makeEvent())) as {
      orders: Record<string, Array<{ id: number }>>;
    };

    expect(Object.keys(result.orders).sort()).toEqual([
      "APPROVED",
      "COMPLETED",
      "DENIED",
      "PENDING",
    ]);
    expect(result.orders.PENDING.map((row) => row.id)).toEqual([pending.id]);
    expect(result.orders.APPROVED.map((row) => row.id)).toEqual([approved.id]);
    expect(result.orders.DENIED.map((row) => row.id)).toEqual([denied.id]);
    expect(result.orders.COMPLETED.map((row) => row.id)).toEqual([completed.id]);
  });

  it("answers 200 with four empty arrays when there are no orders (C6)", async () => {
    const result = (await getAdminOrders(makeEvent())) as { orders: Record<string, unknown[]> };

    expect(result.orders).toEqual({ PENDING: [], APPROVED: [], DENIED: [], COMPLETED: [] });
  });
});
