import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  catalogItems,
  inventory,
  lineItems,
  orders,
  supplierPurchaseOrders,
} from "../db/schema";
import { setInventory } from "./inventory";
import { allocateOrder, recordShipment, retryWaitingAllocations } from "./process-manager";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D5, D7, C9 (order-processing-and-
 * fulfilment): allocation on approval, waiting-order retry, and shipment
 * completing the order. Each test uses its own item ids, so stock never
 * collides between tests.
 */
let accountId: number;
let seq = 0;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "process-manager-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

/** An order with one line per [itemId, quantity], stock seeded per `stock`. */
function makeOrder(
  lines: Array<[string, number]>,
  opts: { status?: string; stage?: string } = {},
): number {
  seq += 1;
  const id = db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1000,
      status: opts.status ?? "APPROVED",
      workflowStage: opts.stage ?? "CONFIRMED",
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
        orderId: id,
        lineNumber: i + 1,
        categoryId: "FISH",
        productId: "P-1",
        itemId,
        quantity,
        unitPriceCents: 100,
      })
      .run();
  });
  return id;
}

const orderRow = (id: number) => db.select().from(orders).where(eq(orders.id, id)).get();
const pos = (orderId: number) =>
  db.select().from(supplierPurchaseOrders).where(eq(supplierPurchaseOrders.orderId, orderId)).all();
const stockOf = (itemId: string) =>
  db.select().from(inventory).where(eq(inventory.itemId, itemId)).get()?.quantity;

function allocate(id: number) {
  return withTransaction((tx) => allocateOrder(tx, id));
}

describe("allocateOrder", () => {
  it("allocates an approved, stocked order: reserves, creates a PO, stage ALLOCATED", () => {
    const item = `PM-A${seq}`;
    const id = makeOrder([[item, 2]]);
    setInventory(item, 5);

    expect(allocate(id)).toBe("ALLOCATED");

    expect(orderRow(id)?.workflowStage).toBe("ALLOCATED");
    expect(stockOf(item)).toBe(3);
    expect(pos(id)).toHaveLength(1);
  });

  it("waits at CONFIRMED with no writes when stock is short", () => {
    const item = `PM-W${seq}`;
    const id = makeOrder([[item, 2]]);
    setInventory(item, 1);

    expect(allocate(id)).toBe("WAITING");

    expect(orderRow(id)?.workflowStage).toBe("CONFIRMED");
    expect(stockOf(item)).toBe(1);
    expect(pos(id)).toHaveLength(0);
  });

  it.each([
    ["a PENDING order", { status: "PENDING", stage: "CONFIRMED" }],
    ["an order not at CONFIRMED", { status: "APPROVED", stage: "PAID" }],
    ["an already ALLOCATED order", { status: "APPROVED", stage: "ALLOCATED" }],
  ])("skips %s", (_name, opts) => {
    const item = `PM-S${seq}`;
    const id = makeOrder([[item, 1]], opts);
    setInventory(item, 5);

    expect(allocate(id)).toBe("SKIPPED");

    expect(stockOf(item)).toBe(5);
    expect(orderRow(id)?.workflowStage).toBe(opts.stage);
  });
});

describe("retryWaitingAllocations", () => {
  it("allocates a waiting order once stock is seeded, and counts it", () => {
    const item = `PM-R${seq}`;
    const id = makeOrder([[item, 2]]);
    expect(allocate(id)).toBe("WAITING");

    setInventory(item, 4);
    const allocated = retryWaitingAllocations();

    expect(allocated).toBeGreaterThanOrEqual(1);
    expect(orderRow(id)?.workflowStage).toBe("ALLOCATED");
    expect(stockOf(item)).toBe(2);
  });
});

describe("recordShipment", () => {
  function allocatedOrder(): { id: number; poIds: number[] } {
    const item = `PM-P${seq}`;
    const id = makeOrder([[item, 1]]);
    setInventory(item, 5);
    allocate(id);
    return { id, poIds: pos(id).map((p) => p.id) };
  }

  it("[SWHR3-C-0179] shipping the only PO with a tracking number completes the order", () => {
    const { id, poIds } = allocatedOrder();

    const result = recordShipment(poIds[0], "TRK-123");

    expect(result).toEqual({ orderCompleted: true });
    const po = pos(id)[0];
    expect(po).toMatchObject({ status: "SHIPPED", trackingNumber: "TRK-123" });
    expect(po.shippedAt).toBeInstanceOf(Date);
    expect(orderRow(id)).toMatchObject({ workflowStage: "SHIPPED", status: "COMPLETED" });
  });

  it("[SWHR3-C-0180] one of two POs shipped leaves the order in progress", () => {
    const { id, poIds } = allocatedOrder();
    // A second PO on the same order, as a second supplier's would be.
    const second = db
      .insert(supplierPurchaseOrders)
      .values({
        orderId: id,
        supplierId: "OTHER-SUPPLIER",
        status: "OPEN",
        expectedDeliveryDate: new Date("2026-02-01T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      })
      .returning({ id: supplierPurchaseOrders.id })
      .get().id;

    const result = recordShipment(poIds[0], "TRK-1");

    expect(result).toEqual({ orderCompleted: false });
    expect(pos(id).find((p) => p.id === poIds[0])?.status).toBe("SHIPPED");
    expect(pos(id).find((p) => p.id === second)?.status).toBe("OPEN");
    expect(orderRow(id)).toMatchObject({ workflowStage: "ALLOCATED", status: "APPROVED" });
  });
});
