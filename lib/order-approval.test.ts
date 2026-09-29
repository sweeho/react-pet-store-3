import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  catalogItems,
  inventory,
  inventoryReservations,
  lineItems,
  orderStageHistory,
  orders,
  supplierPurchaseOrders,
} from "../db/schema";
import { setInventory } from "./inventory";
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

describe("updateOrders allocation hook (design.md D5, D8)", () => {
  // The top-level beforeEach deletes orders, so clear the rows that reference them.
  afterEach(() => {
    db.delete(inventoryReservations).run();
    db.delete(orderStageHistory).run();
    db.delete(lineItems).run();
    db.delete(supplierPurchaseOrders).run();
  });

  function confirmedOrder(username: string, lines: Array<[string, number]>) {
    const account = makeAccount(username);
    const order = db
      .insert(orders)
      .values({
        accountId: account.id,
        customerName: "Alice Anderson",
        orderDate: new Date("2026-01-01T00:00:00.000Z"),
        totalCents: 1999,
        workflowStage: "CONFIRMED",
      })
      .returning()
      .get();
    lines.forEach(([itemId, quantity], i) => {
      db.insert(catalogItems)
        .values({ itemId, productId: "P-1", category: "FISH", unitCostCents: 100 })
        .onConflictDoNothing()
        .run();
      db.insert(lineItems)
        .values({
          orderId: order.id,
          lineNumber: i + 1,
          categoryId: "FISH",
          productId: "P-1",
          itemId,
          quantity,
          unitPriceCents: 100,
        })
        .run();
    });
    return order;
  }

  const stage = (id: number) =>
    db.select().from(orders).where(eq(orders.id, id)).get()?.workflowStage;
  const stock = (itemId: string) =>
    db.select().from(inventory).where(eq(inventory.itemId, itemId)).get()?.quantity;

  it("[SWHR3-C-0172] approval reserves stock and decrements inventory", () => {
    const order = confirmedOrder("alloc-approve", [
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    setInventory("EST-1", 5);
    setInventory("EST-2", 3);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    updateOrders({ changes: [{ orderId: order.id, status: "APPROVED" }] });

    expect(stock("EST-1")).toBe(3);
    expect(stock("EST-2")).toBe(2);
    const reservations = db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, order.id))
      .all();
    expect(reservations.map((r) => [r.itemId, r.quantity]).sort()).toEqual([
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    expect(stage(order.id)).toBe("ALLOCATED");
  });

  it("an unstocked approval still commits and waits at CONFIRMED", () => {
    const order = confirmedOrder("alloc-wait", [["EST-NOSTOCK", 1]]);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    expect(updateOrders({ changes: [{ orderId: order.id, status: "APPROVED" }] })).toEqual({
      updated: 1,
    });

    expect(db.select().from(orders).where(eq(orders.id, order.id)).get()?.status).toBe("APPROVED");
    expect(stage(order.id)).toBe("CONFIRMED");
    // SD9 (supplier-portal-and-inventory): it waits with a PENDING supplier PO.
    const pos = db
      .select()
      .from(supplierPurchaseOrders)
      .where(eq(supplierPurchaseOrders.orderId, order.id))
      .all();
    expect(pos.map((p) => p.status)).toEqual(["PENDING"]);
  });

  it("[SWHR3-C-0214] approval with stock still allocates immediately", () => {
    const order = confirmedOrder("alloc-now", [["EST-NOW", 2]]);
    setInventory("EST-NOW", 5);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    updateOrders({ changes: [{ orderId: order.id, status: "APPROVED" }] });

    const pos = db
      .select()
      .from(supplierPurchaseOrders)
      .where(eq(supplierPurchaseOrders.orderId, order.id))
      .all();
    expect(pos.map((p) => p.status)).toEqual(["PROCESSING"]);
    expect(stock("EST-NOW")).toBe(3);
    expect(stage(order.id)).toBe("ALLOCATED");
  });

  it("a denied order is never allocated", () => {
    const order = confirmedOrder("alloc-deny", [["EST-DENY", 1]]);
    setInventory("EST-DENY", 5);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    updateOrders({ changes: [{ orderId: order.id, status: "DENIED" }] });

    expect(stock("EST-DENY")).toBe(5);
    expect(stage(order.id)).toBe("CONFIRMED");
  });
});
