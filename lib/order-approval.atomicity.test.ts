import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, orders } from "../db/schema";
import { InvalidTransitionError } from "./errors";
import { updateOrders } from "./order-approval";
import type { OrderStatus } from "./order-status";

/**
 * INTEGRATION TEST (server project)
 *
 * Dedicated batch-atomicity suite (design.md D6, contract C4, SD6) against
 * the real in-memory db. lib/order-approval.test.ts (SWHR3-T-0040) already
 * covers updateOrders' shape and its unknown-id rollback; this file proves
 * the three specific scenarios this ticket's AC names: a clean three-order
 * commit, a mid-batch business-rule failure (not just an unknown id), and
 * two sequential batches racing the same order.
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

describe("updateOrders batch atomicity", () => {
  it("[SWHR3-C-0021] a three-order batch commits together in one transaction (AC-1)", () => {
    const account = makeAccount("atomicity-commit-together");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);
    const orderC = insertOrder(account.id);

    const result = updateOrders({
      changes: [
        { orderId: orderA.id, status: "APPROVED" },
        { orderId: orderB.id, status: "DENIED" },
        { orderId: orderC.id, status: "APPROVED" },
      ],
    });

    expect(result).toEqual({ updated: 3 });

    const rowA = readOrder(orderA.id);
    const rowB = readOrder(orderB.id);
    const rowC = readOrder(orderC.id);

    expect(rowA?.status).toBe("APPROVED");
    expect(rowB?.status).toBe("DENIED");
    expect(rowC?.status).toBe("APPROVED");
    // The three writes happen inside one transaction (SD6): they share the
    // same updatedAt write.
    expect(rowA?.updatedAt.getTime()).toBe(rowB?.updatedAt.getTime());
    expect(rowB?.updatedAt.getTime()).toBe(rowC?.updatedAt.getTime());
  });

  it("[SWHR3-C-0022] a failing second update leaves none of the three persisted (AC-2)", () => {
    const account = makeAccount("atomicity-partial-failure");
    const orderA = insertOrder(account.id, "PENDING");
    const orderB = insertOrder(account.id, "COMPLETED");
    const orderC = insertOrder(account.id, "PENDING");

    let caught: unknown;
    try {
      updateOrders({
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: orderB.id, status: "DENIED" },
          { orderId: orderC.id, status: "APPROVED" },
        ],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InvalidTransitionError);
    expect((caught as Error).message).toContain(String(orderB.id));

    expect(readOrder(orderA.id)?.status).toBe("PENDING");
    expect(readOrder(orderB.id)?.status).toBe("COMPLETED");
    expect(readOrder(orderC.id)?.status).toBe("PENDING");
  });

  it("[SWHR3-C-0023] overlapping batches on the same order cannot both succeed (AC-4)", () => {
    const account = makeAccount("atomicity-overlapping-batches");
    const orderA = insertOrder(account.id, "PENDING");
    const orderD = insertOrder(account.id, "PENDING");

    const batch1 = updateOrders({ changes: [{ orderId: orderA.id, status: "APPROVED" }] });
    expect(batch1).toEqual({ updated: 1 });
    expect(readOrder(orderA.id)?.status).toBe("APPROVED");

    expect(() =>
      updateOrders({
        changes: [
          { orderId: orderD.id, status: "APPROVED" },
          { orderId: orderA.id, status: "DENIED" },
        ],
      }),
    ).toThrow(InvalidTransitionError);

    expect(readOrder(orderA.id)?.status).toBe("APPROVED");
    expect(readOrder(orderD.id)?.status).toBe("PENDING");
  });
});
