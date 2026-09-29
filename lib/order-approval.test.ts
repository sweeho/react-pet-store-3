import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { accounts, orders } from "../db/schema";
import { InvalidTransitionError, NotFoundError } from "./errors";
import { updateOrders } from "./order-approval";
import type { OrderStatus } from "./order-status";

/**
 * UNIT TEST (server project)
 *
 * Exercises lib/order-approval.ts (design.md D6/D7, interface contract C4)
 * against the real in-memory db (VITEST=true swaps sqlite.db for :memory:,
 * see db/client.ts). The linked test cases (SWHR3-C-0013, SWHR3-C-0016)
 * describe reaching updateOrders through the admin HTTP route; that route
 * belongs to a different ticket (design.md ticket map, group 4), so these
 * tests call the service directly, which is what this ticket owns.
 */
function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

function insertOrder(accountId: number, status: OrderStatus = "PENDING") {
  return db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1999,
      status,
    })
    .returning()
    .get();
}

function readOrder(id: number) {
  return db.select().from(orders).where(eq(orders.id, id)).get();
}

beforeEach(() => {
  db.delete(orders).run();
});

describe("updateOrders", () => {
  it("[SWHR3-C-0013] applies every change in the batch and returns the count", () => {
    const account = makeAccount("order-approval-valid");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);

    const result = updateOrders({
      changes: [
        { orderId: orderA.id, status: "APPROVED" },
        { orderId: orderB.id, status: "DENIED" },
      ],
    });

    expect(result).toEqual({ updated: 2 });
    expect(readOrder(orderA.id)?.status).toBe("APPROVED");
    expect(readOrder(orderB.id)?.status).toBe("DENIED");
  });

  it("[SWHR3-C-0016] rolls back the whole batch when one order id is unknown", () => {
    const account = makeAccount("order-approval-unknown-id");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);
    const orderAUpdatedAt = orderA.updatedAt;
    const orderBUpdatedAt = orderB.updatedAt;

    expect(() =>
      updateOrders({
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: 999999, status: "DENIED" },
          { orderId: orderB.id, status: "APPROVED" },
        ],
      }),
    ).toThrow(NotFoundError);

    const rowA = readOrder(orderA.id);
    const rowB = readOrder(orderB.id);
    expect(rowA?.status).toBe("PENDING");
    expect(rowA?.updatedAt.getTime()).toBe(orderAUpdatedAt.getTime());
    expect(rowB?.status).toBe("PENDING");
    expect(rowB?.updatedAt.getTime()).toBe(orderBUpdatedAt.getTime());
  });

  it("rolls back the whole batch when one order is no longer PENDING", () => {
    const account = makeAccount("order-approval-invalid-transition");
    const orderA = insertOrder(account.id, "PENDING");
    const orderB = insertOrder(account.id, "APPROVED");

    expect(() =>
      updateOrders({
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: orderB.id, status: "DENIED" },
        ],
      }),
    ).toThrow(InvalidTransitionError);

    expect(readOrder(orderA.id)?.status).toBe("PENDING");
    expect(readOrder(orderB.id)?.status).toBe("APPROVED");
  });

  it("writes exactly one log line naming each order and its new status, without a user name", () => {
    const account = makeAccount("order-approval-log-success");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    updateOrders({
      changes: [
        { orderId: orderA.id, status: "APPROVED" },
        { orderId: orderB.id, status: "DENIED" },
      ],
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const [line] = infoSpy.mock.calls[0] as [string];
    expect(line).toBe(`order-approval: committed 2 (${orderA.id}→APPROVED, ${orderB.id}→DENIED)`);
    expect(line).not.toMatch(/order-approval-log-success/);

    infoSpy.mockRestore();
  });

  it("writes no log line when the batch fails", () => {
    const account = makeAccount("order-approval-log-failure");
    const orderA = insertOrder(account.id);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    expect(() =>
      updateOrders({
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: 999999, status: "DENIED" },
        ],
      }),
    ).toThrow(NotFoundError);

    expect(infoSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
