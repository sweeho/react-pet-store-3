import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, lineItems, orders } from "../db/schema";

/**
 * UNIT TEST (server project). design.md D11/C1: line_items is defined now
 * and written by nobody yet, so the table is exercised directly.
 */
let orderId: number;

beforeAll(() => {
  const account = db
    .insert(accounts)
    .values({ username: "line-items-fixture", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
  orderId = db
    .insert(orders)
    .values({
      accountId: account.id,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      status: "PENDING",
      totalCents: 3300,
    })
    .returning({ id: orders.id })
    .get().id;
});

function read(lineNumber: number) {
  return db
    .select()
    .from(lineItems)
    .where(and(eq(lineItems.orderId, orderId), eq(lineItems.lineNumber, lineNumber)))
    .get();
}

describe("line_items", () => {
  it("[SWHR3-C-0093] persists a line item with all seven fields", () => {
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-1",
        quantity: 2,
        unitPriceCents: 1650,
        quantityShipped: 0,
      })
      .run();

    expect(read(1)).toEqual({
      orderId,
      lineNumber: 1,
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId: "EST-1",
      quantity: 2,
      unitPriceCents: 1650,
      quantityShipped: 0,
    });
  });

  it("[SWHR3-C-0094] exposes fields by name and defaults quantityShipped to 0", () => {
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: 2,
        categoryId: "DOGS",
        productId: "K9-BD-01",
        itemId: "EST-6",
        quantity: 1,
        unitPriceCents: 1850,
      })
      .run();

    const row = read(2);
    expect(row).toBeDefined();
    expect(Object.keys(row!).sort()).toEqual(
      [
        "categoryId",
        "itemId",
        "lineNumber",
        "orderId",
        "productId",
        "quantity",
        "quantityShipped",
        "unitPriceCents",
      ].sort(),
    );
    expect(row!.quantityShipped).toBe(0);
  });

  it("[SWHR3-C-0095] stores ordered and shipped quantities independently", () => {
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: 3,
        categoryId: "CATS",
        productId: "FL-DSH-01",
        itemId: "EST-14",
        quantity: 10,
        unitPriceCents: 1200,
      })
      .run();
    db.update(lineItems)
      .set({ quantityShipped: 5 })
      .where(and(eq(lineItems.orderId, orderId), eq(lineItems.lineNumber, 3)))
      .run();

    const row = read(3);
    expect(row?.quantity).toBe(10);
    expect(row?.quantityShipped).toBe(5);
  });
});
