import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  catalogItems,
  inventory,
  lineItems,
  orders,
  supplierPurchaseOrders,
} from "../db/schema";
import { applyInventoryUpdate } from "./inventory-update";
import { setInventory } from "./inventory";
import { createSupplierPOs } from "./supplier-pos";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D6, C7 (supplier-portal-and-
 * inventory): an inventory update and the reprocessing it triggers are one
 * immediate transaction. Item ids are per test; the first test relies on
 * being the only one with pending POs (the db is fresh per test file).
 */
let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "inventory-update-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  for (const itemId of ["EST-1", "EST-2", "EST-3"]) {
    db.insert(catalogItems)
      .values({ itemId, productId: "P-1", category: "FISH", unitCostCents: 100 })
      .onConflictDoNothing()
      .run();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** An APPROVED order at CONFIRMED with one line and one PENDING PO. */
function waitingOrder(itemId: string, quantity: number): { orderId: number; poId: number } {
  const orderId = db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1000,
      status: "APPROVED",
      workflowStage: "CONFIRMED",
    })
    .returning({ id: orders.id })
    .get().id;
  db.insert(lineItems)
    .values({
      orderId,
      lineNumber: 1,
      categoryId: "FISH",
      productId: "P-1",
      itemId,
      quantity,
      unitPriceCents: 100,
    })
    .run();
  const [poId] = withTransaction((tx) =>
    createSupplierPOs(tx, orderId, [{ lineNumber: 1, itemId }]),
  );
  return { orderId, poId };
}

const stock = (itemId: string) =>
  db.select().from(inventory).where(eq(inventory.itemId, itemId)).get()?.quantity;
const poStatus = (poId: number) =>
  db.select().from(supplierPurchaseOrders).where(eq(supplierPurchaseOrders.id, poId)).get()?.status;
const stageOf = (orderId: number) =>
  db.select().from(orders).where(eq(orders.id, orderId)).get()?.workflowStage;

describe("applyInventoryUpdate", () => {
  it("[SWHR3-C-0212] an update retries every pending supplier PO", () => {
    const a = waitingOrder("EST-1", 2);
    const b = waitingOrder("EST-2", 5);
    setInventory("EST-1", 0);
    setInventory("EST-2", 0);

    const result = applyInventoryUpdate([{ itemId: "EST-1", quantity: 3 }]);

    expect(result).toEqual({ updated: ["EST-1"], processedOrders: 2, fulfilledOrders: 1 });
    expect(poStatus(a.poId)).toBe("PROCESSING");
    expect(stock("EST-1")).toBe(1);
    expect(stageOf(a.orderId)).toBe("ALLOCATED");
    expect(poStatus(b.poId)).toBe("PENDING");
    expect(stageOf(b.orderId)).toBe("CONFIRMED");
  });

  it("[SWHR3-C-0208] zero and positive quantities are accepted and saved", () => {
    setInventory("EST-1", 40);
    setInventory("EST-2", 7);

    const result = applyInventoryUpdate([
      { itemId: "EST-1", quantity: 0 },
      { itemId: "EST-2", quantity: 25 },
    ]);

    expect(result.updated).toEqual(["EST-1", "EST-2"]);
    expect(stock("EST-1")).toBe(0);
    expect(stock("EST-2")).toBe(25);
  });

  it("an update that covers a waiting PO fulfils it in the same call", () => {
    const { orderId, poId } = waitingOrder("EST-3", 4);
    setInventory("EST-3", 0);

    const result = applyInventoryUpdate([{ itemId: "EST-3", quantity: 4 }]);

    expect(result.fulfilledOrders).toBe(1);
    expect(poStatus(poId)).toBe("PROCESSING");
    expect(stock("EST-3")).toBe(0);
    expect(stageOf(orderId)).toBe("ALLOCATED");
  });

  it("an empty update list changes nothing but still reprocesses", () => {
    const { poId } = waitingOrder("EST-3", 9);
    setInventory("EST-3", 9);

    const result = applyInventoryUpdate([]);

    expect(result.updated).toEqual([]);
    expect(result.fulfilledOrders).toBeGreaterThanOrEqual(1);
    expect(poStatus(poId)).toBe("PROCESSING");
  });

  it("logs each item's quantity before and after", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    setInventory("EST-1", 6);

    applyInventoryUpdate([{ itemId: "EST-1", quantity: 2 }]);

    expect(info).toHaveBeenCalledWith(expect.stringContaining("EST-1"));
    const message = String(info.mock.calls[0][0]);
    expect(message).toContain("6");
    expect(message).toContain("2");
  });

  it("is one immediate transaction, or joins the caller's", () => {
    setInventory("EST-1", 1);
    const spy = vi.spyOn(db, "transaction");

    applyInventoryUpdate([{ itemId: "EST-1", quantity: 2 }]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toEqual({ behavior: "immediate" });

    spy.mockClear();
    withTransaction((tx) => applyInventoryUpdate([{ itemId: "EST-1", quantity: 3 }], tx));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("a failing update rolls back every quantity it set", () => {
    setInventory("EST-1", 10);
    setInventory("EST-2", 10);

    expect(() =>
      applyInventoryUpdate([
        { itemId: "EST-1", quantity: 99 },
        { itemId: "NOT-IN-CATALOGUE", quantity: 1 },
      ]),
    ).toThrow();

    expect(stock("EST-1")).toBe(10);
    expect(stock("EST-2")).toBe(10);
  });
});
