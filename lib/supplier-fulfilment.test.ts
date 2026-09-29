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
import { fulfilSupplierOrder, processPendingSupplierOrders } from "./supplier-fulfilment";
import { createSupplierPOs } from "./supplier-pos";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D5, C8 (supplier-portal-and-
 * inventory): fulfilling a PENDING PO checks every line against stock and
 * deducts all-or-nothing; pending POs are retried in bulk. Each test uses its
 * own item ids so stock never collides between tests.
 */
let accountId: number;
let seq = 0;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-fulfilment-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

/** An APPROVED order at CONFIRMED with one line per [itemId, quantity] and one PENDING PO. */
function makePendingOrder(lines: Array<[string, number]>): { orderId: number; poId: number } {
  seq += 1;
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
  lines.forEach(([itemId, quantity], i) => {
    db.insert(catalogItems)
      .values({ itemId, productId: "P-1", category: "FISH", unitCostCents: 100 })
      .onConflictDoNothing()
      .run();
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: i + 1,
        categoryId: "FISH",
        productId: "P-1",
        itemId,
        quantity,
        unitPriceCents: 100,
      })
      .run();
  });
  const [poId] = withTransaction((tx) =>
    createSupplierPOs(
      tx,
      orderId,
      lines.map(([itemId], i) => ({ lineNumber: i + 1, itemId })),
    ),
  );
  return { orderId, poId };
}

const stock = (itemId: string) =>
  db.select().from(inventory).where(eq(inventory.itemId, itemId)).get()?.quantity;
const poStatus = (poId: number) =>
  db.select().from(supplierPurchaseOrders).where(eq(supplierPurchaseOrders.id, poId)).get()?.status;
const stageOf = (orderId: number) =>
  db.select().from(orders).where(eq(orders.id, orderId)).get()?.workflowStage;
const reservations = (orderId: number) =>
  db
    .select({ n: count() })
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, orderId))
    .get()?.n ?? 0;

describe("fulfilSupplierOrder", () => {
  it("[SWHR3-C-0206] checks stock against each line, then deducts and moves the PO to PROCESSING", () => {
    const [a, b] = [`SF-A${seq}`, `SF-B${seq}`];
    const { orderId, poId } = makePendingOrder([
      [a, 2],
      [b, 1],
    ]);
    setInventory(a, 5);
    setInventory(b, 1);

    const outcome = withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    expect(outcome).toEqual({ result: "FULFILLED", shortItems: [] });
    expect(stock(a)).toBe(3);
    expect(stock(b)).toBe(0);
    expect(reservations(orderId)).toBe(2);
    expect(poStatus(poId)).toBe("PROCESSING");
  });

  it("moves the order to ALLOCATED once every PO of it is PROCESSING", () => {
    const item = `SF-C${seq}`;
    const { orderId, poId } = makePendingOrder([[item, 1]]);
    setInventory(item, 1);

    withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    expect(stageOf(orderId)).toBe("ALLOCATED");
  });

  it("a two-line PO with one line short deducts neither line and stays PENDING", () => {
    const [a, b] = [`SF-D${seq}`, `SF-E${seq}`];
    const { orderId, poId } = makePendingOrder([
      [a, 2],
      [b, 3],
    ]);
    setInventory(a, 5);
    setInventory(b, 1);

    const outcome = withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    expect(outcome).toEqual({
      result: "UNABLE",
      shortItems: [{ itemId: b, needed: 3, available: 1 }],
    });
    expect(stock(a)).toBe(5);
    expect(stock(b)).toBe(1);
    expect(reservations(orderId)).toBe(0);
    expect(poStatus(poId)).toBe("PENDING");
    expect(stageOf(orderId)).toBe("CONFIRMED");
  });

  it("counts an item with no inventory row as stock 0", () => {
    const item = `SF-F${seq}`;
    const { poId } = makePendingOrder([[item, 1]]);

    const outcome = withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    expect(outcome.shortItems).toEqual([{ itemId: item, needed: 1, available: 0 }]);
  });

  it("skips a PO that is not PENDING and changes nothing", () => {
    const item = `SF-G${seq}`;
    const { poId } = makePendingOrder([[item, 1]]);
    setInventory(item, 5);
    withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    const again = withTransaction((tx) => fulfilSupplierOrder(tx, poId));

    expect(again).toEqual({ result: "SKIPPED", shortItems: [] });
    expect(stock(item)).toBe(4);
  });
});

describe("processPendingSupplierOrders", () => {
  it("[SWHR3-C-0213] a retried PO with enough stock moves PENDING to PROCESSING and the order to ALLOCATED", () => {
    const item = `SF-H${seq}`;
    const { orderId, poId } = makePendingOrder([[item, 2]]);
    setInventory(item, 0);
    expect(withTransaction((tx) => fulfilSupplierOrder(tx, poId)).result).toBe("UNABLE");

    setInventory(item, 2);
    const summary = withTransaction((tx) => processPendingSupplierOrders(tx));

    expect(summary.fulfilled).toBeGreaterThanOrEqual(1);
    expect(summary.processed).toBeGreaterThanOrEqual(summary.fulfilled);
    expect(poStatus(poId)).toBe("PROCESSING");
    expect(stock(item)).toBe(0);
    expect(stageOf(orderId)).toBe("ALLOCATED");
  });

  it("leaves a PO that is still short PENDING, and counts it processed but not fulfilled", () => {
    const item = `SF-I${seq}`;
    const { poId } = makePendingOrder([[item, 5]]);
    setInventory(item, 1);

    const before = db
      .select({ n: count() })
      .from(supplierPurchaseOrders)
      .where(eq(supplierPurchaseOrders.status, "PENDING"))
      .get()?.n;
    const summary = withTransaction((tx) => processPendingSupplierOrders(tx));

    expect(poStatus(poId)).toBe("PENDING");
    expect(summary.processed).toBe(before);
    expect(stock(item)).toBe(1);
  });

  it("serves older POs first when stock covers only one", () => {
    const item = `SF-J${seq}`;
    const first = makePendingOrder([[item, 2]]);
    const second = makePendingOrder([[item, 2]]);
    setInventory(item, 2);

    withTransaction((tx) => processPendingSupplierOrders(tx));

    expect(poStatus(first.poId)).toBe("PROCESSING");
    expect(poStatus(second.poId)).toBe("PENDING");
  });
});
