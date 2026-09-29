import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  catalogItems,
  inventory,
  inventoryReservations,
  lineItems,
  orders,
  supplierPurchaseOrders,
} from "../db/schema";
import { setInventory } from "./inventory";
import { applyInventoryUpdate } from "./inventory-update";
import { createSupplierPOs } from "./supplier-pos";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). SD10 (supplier-portal-and-inventory): there is
 * one SQLite database and every update is one immediate transaction, so
 * concurrent updates serialise. Two updates to one item end with one of the
 * two outcomes and a consistent reprocessing count; a PO is fulfilled once.
 * Proof only: no production file changes.
 */
let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-concurrency-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

function makeItem(prefix: string): string {
  const itemId = `${prefix}-${randomUUID().slice(0, 8)}`;
  db.insert(catalogItems)
    .values({ itemId, productId: "P-1", category: "FISH", unitCostCents: 100 })
    .run();
  return itemId;
}

/** An APPROVED order at CONFIRMED with one PENDING PO for `quantity` of `itemId`. */
function waitingPo(itemId: string, quantity: number): { orderId: number; poId: number } {
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

/** Runs the calls "concurrently": each starts in its own microtask, as separate requests would. */
function inParallel<T>(calls: Array<() => T>): Promise<T[]> {
  return Promise.all(calls.map((call) => Promise.resolve().then(call)));
}

describe("concurrent inventory updates", () => {
  it("two updates to one item end with one of the two values and a consistent reprocessing count", async () => {
    const item = makeItem("CC-A");
    const { poId } = waitingPo(item, 2);
    setInventory(item, 0);

    const [first, second] = await inParallel([
      () => applyInventoryUpdate([{ itemId: item, quantity: 1 }]),
      () => applyInventoryUpdate([{ itemId: item, quantity: 5 }]),
    ]);

    // Serialised either way: the PO (needs 2) is fulfilled exactly once, by whichever call left stock >= 2.
    expect(first.fulfilledOrders + second.fulfilledOrders).toBe(1);
    expect(
      db.select().from(supplierPurchaseOrders).where(eq(supplierPurchaseOrders.id, poId)).get()
        ?.status,
    ).toBe("PROCESSING");
    expect(
      db
        .select({ n: count() })
        .from(inventoryReservations)
        .where(eq(inventoryReservations.itemId, item))
        .get()?.n,
    ).toBe(1);
    // 1 then 5 leaves 5 - 2 = 3; 5 then 1 leaves 1 (5 - 2 = 3, then overwritten by 1).
    expect([1, 3]).toContain(stock(item));
  });

  it("many concurrent updates to different items are all applied", async () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`CC-B${i}`));

    await inParallel(
      items.map((item, i) => () => applyInventoryUpdate([{ itemId: item, quantity: i }])),
    );

    expect(items.map((item) => stock(item))).toEqual(items.map((_, i) => i));
  });

  it("concurrent updates never fulfil one PO twice or drive stock negative", async () => {
    const item = makeItem("CC-C");
    const { poId } = waitingPo(item, 3);
    setInventory(item, 0);

    await inParallel(
      Array.from({ length: 8 }, () => () => applyInventoryUpdate([{ itemId: item, quantity: 4 }])),
    );

    // Each call sets 4; the first fulfilment takes 3, later calls reset to 4 with nothing left to fulfil.
    expect([1, 4]).toContain(stock(item));
    expect(stock(item)).toBeGreaterThanOrEqual(0);
    expect(
      db
        .select({ n: count() })
        .from(inventoryReservations)
        .where(eq(inventoryReservations.orderId, waitingOrderId(poId)))
        .get()?.n,
    ).toBe(1);
  });
});

function waitingOrderId(poId: number): number {
  const po = db
    .select()
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.id, poId))
    .get();
  if (!po) {
    throw new Error(`PO ${poId} not found`);
  }
  return po.orderId;
}
