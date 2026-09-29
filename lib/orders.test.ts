import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, orders } from "../db/schema";
import { getOrdersGroupedByStatus, listOrdersByStatus, updateOrderStatus } from "./orders";
import { InvalidTransitionError, NotFoundError } from "./errors";
import type { OrderStatus } from "./order-status";

/**
 * UNIT TEST (server project)
 *
 * Exercises lib/orders.ts (design.md D1/D2/C1/C3) against the real
 * in-memory db (VITEST=true swaps sqlite.db for :memory:, see
 * db/client.ts). Each test creates its own account and picks order dates
 * that make sort order unambiguous, so tests never collide.
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
  overrides: {
    status?: OrderStatus;
    orderDate?: Date;
    customerName?: string;
    totalCents?: number;
  } = {},
) {
  return db
    .insert(orders)
    .values({
      accountId,
      customerName: overrides.customerName ?? "Alice Anderson",
      orderDate: overrides.orderDate ?? new Date("2026-01-01T00:00:00.000Z"),
      totalCents: overrides.totalCents ?? 1999,
      status: overrides.status ?? "PENDING",
    })
    .returning()
    .get();
}

// getOrdersGroupedByStatus and listOrdersByStatus scan every order in the
// db (there is no per-account filter — an admin sees every order), so each
// test starts from an empty orders table to stay independent of the others
// sharing this file's in-memory db.
beforeEach(() => {
  db.delete(orders).run();
});

describe("accounts.role (C1)", () => {
  it("an account created without a role reads back as 'customer'", () => {
    const account = makeAccount("orders-role-default");
    const row = db.select().from(accounts).where(eq(accounts.id, account.id)).get();

    expect(row?.role).toBe("customer");
  });
});

describe("listOrdersByStatus", () => {
  it("returns only orders in the requested status, sorted by orderDate ascending (C3)", () => {
    const account = makeAccount("orders-list-1");
    const later = insertOrder(account.id, {
      status: "PENDING",
      orderDate: new Date("2026-02-01T00:00:00.000Z"),
      customerName: "Later Order",
    });
    const earlier = insertOrder(account.id, {
      status: "PENDING",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      customerName: "Earlier Order",
    });
    insertOrder(account.id, { status: "APPROVED" });

    const result = listOrdersByStatus("PENDING");
    const ids = result.map((row) => row.id);

    expect(ids).toEqual([earlier.id, later.id]);
    expect(result.every((row) => row.status === "PENDING")).toBe(true);
  });

  it("shapes each row as an OrderRow with orderDate as ISO 8601 (C3)", () => {
    const account = makeAccount("orders-list-2");
    const created = insertOrder(account.id, {
      status: "APPROVED",
      orderDate: new Date("2026-03-15T12:30:00.000Z"),
      customerName: "Row Shape Co.",
      totalCents: 4599,
    });

    const [row] = listOrdersByStatus("APPROVED");

    expect(row).toEqual({
      id: created.id,
      customerName: "Row Shape Co.",
      orderDate: "2026-03-15T12:30:00.000Z",
      totalCents: 4599,
      status: "APPROVED",
    });
  });
});

describe("getOrdersGroupedByStatus", () => {
  it("[SWHR3-C-0002] returns all four groups with the right counts, each sorted by orderDate ascending", () => {
    const account = makeAccount("orders-grouped-1");
    const pendingEarly = insertOrder(account.id, {
      status: "PENDING",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
    });
    const pendingLate = insertOrder(account.id, {
      status: "PENDING",
      orderDate: new Date("2026-01-02T00:00:00.000Z"),
    });
    const approved = insertOrder(account.id, { status: "APPROVED" });
    const denied = insertOrder(account.id, { status: "DENIED" });
    const completed = insertOrder(account.id, { status: "COMPLETED" });

    const grouped = getOrdersGroupedByStatus();

    expect(Object.keys(grouped).sort()).toEqual(["APPROVED", "COMPLETED", "DENIED", "PENDING"]);
    expect(grouped.PENDING.map((row) => row.id)).toEqual([pendingEarly.id, pendingLate.id]);
    expect(grouped.APPROVED.map((row) => row.id)).toEqual([approved.id]);
    expect(grouped.DENIED.map((row) => row.id)).toEqual([denied.id]);
    expect(grouped.COMPLETED.map((row) => row.id)).toEqual([completed.id]);
  });

  it("[SWHR3-C-0003] a status with no orders still appears as an empty group", () => {
    const account = makeAccount("orders-grouped-2");
    const pending1 = insertOrder(account.id, { status: "PENDING" });
    const pending2 = insertOrder(account.id, {
      status: "PENDING",
      orderDate: new Date("2026-01-05T00:00:00.000Z"),
    });

    const grouped = getOrdersGroupedByStatus();

    expect(grouped.APPROVED).toEqual([]);
    expect(grouped.DENIED).toEqual([]);
    expect(grouped.COMPLETED).toEqual([]);
    expect(grouped.PENDING.map((row) => row.id).sort((a, b) => a - b)).toEqual(
      [pending1.id, pending2.id].sort((a, b) => a - b),
    );
  });
});

describe("updateOrderStatus", () => {
  it("moves a PENDING order to APPROVED, updating status and updatedAt (C3)", () => {
    const account = makeAccount("orders-update-1");
    const order = insertOrder(account.id, { status: "PENDING" });

    updateOrderStatus(db, order.id, "APPROVED");

    const row = db.select().from(orders).where(eq(orders.id, order.id)).get();
    expect(row?.status).toBe("APPROVED");
    expect(row?.updatedAt.getTime()).toBeGreaterThanOrEqual(order.updatedAt.getTime());
  });

  it("throws NotFoundError for an unknown order id (C3)", () => {
    expect(() => updateOrderStatus(db, 999999, "APPROVED")).toThrow(NotFoundError);
  });

  it("throws InvalidTransitionError for a non-PENDING row and leaves it unchanged (C3)", () => {
    const account = makeAccount("orders-update-2");
    const order = insertOrder(account.id, { status: "APPROVED" });

    expect(() => updateOrderStatus(db, order.id, "DENIED")).toThrow(InvalidTransitionError);

    const row = db.select().from(orders).where(eq(orders.id, order.id)).get();
    expect(row?.status).toBe("APPROVED");
  });
});
