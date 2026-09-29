import { count, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  catalogItems,
  lineItems,
  orderContacts,
  orders,
  supplierInvoices,
  supplierPurchaseOrders,
} from "../db/schema";
import { InvalidTransitionError } from "./errors";
import { generateInvoice, getInvoice, receiveInvoice } from "./invoices";
import { setInventory } from "./inventory";
import { allocateOrder, recordShipment } from "./process-manager";
import { markPoShipped } from "./supplier-pos";
import * as suppliers from "./suppliers";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project). design.md D9, C9 (supplier-portal-and-
 * inventory): shipping a PO generates its invoice and delivers it in-process
 * to the order side, which records shipped quantities and completes the
 * order once every PO is done. Each order uses its own item ids.
 */
let accountId: number;
let seq = 0;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "invoices-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** An APPROVED order at CONFIRMED with a SHIP_TO snapshot; lines are [itemId, quantity, unitPriceCents]. */
function makeOrder(lines: Array<[string, number, number]>): number {
  const id = db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alex Chen",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1000,
      status: "APPROVED",
      workflowStage: "CONFIRMED",
    })
    .returning({ id: orders.id })
    .get().id;
  db.insert(orderContacts)
    .values({
      orderId: id,
      role: "SHIP_TO",
      familyName: "Chen",
      givenName: "Alex",
      address1: "88 Market Street",
      address2: null,
      city: "San Francisco",
      stateOrProvince: "CA",
      postalCode: "94103",
      country: "United States",
      telephoneNumber: "+1 415 555 0177",
      email: "alex@example.com",
    })
    .run();
  lines.forEach(([itemId, quantity, unitPriceCents], i) => {
    db.insert(catalogItems)
      .values({ itemId, productId: "P-1", category: "FISH", unitCostCents: unitPriceCents })
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
        unitPriceCents,
      })
      .run();
    setInventory(itemId, quantity + 5);
  });
  return id;
}

const allocate = (id: number) => withTransaction((tx) => allocateOrder(tx, id));
const orderRow = (id: number) => db.select().from(orders).where(eq(orders.id, id)).get();
const poIds = (orderId: number) =>
  db
    .select({ id: supplierPurchaseOrders.id })
    .from(supplierPurchaseOrders)
    .where(eq(supplierPurchaseOrders.orderId, orderId))
    .orderBy(supplierPurchaseOrders.id)
    .all()
    .map((r) => r.id);
const shipped = (orderId: number) =>
  db
    .select({ itemId: lineItems.itemId, shipped: lineItems.quantityShipped })
    .from(lineItems)
    .where(eq(lineItems.orderId, orderId))
    .orderBy(lineItems.lineNumber)
    .all();

describe("shipping a PO generates and delivers its invoice", () => {
  it("[SWHR3-C-0215] the invoice has the order, date, items, quantities and total", () => {
    const a = `INV-A${(seq += 1)}`;
    const b = `INV-B${seq}`;
    const orderId = makeOrder([
      [a, 2, 1999],
      [b, 1, 550],
    ]);
    expect(allocate(orderId)).toBe("ALLOCATED");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T09:00:00Z"));

    const { invoiceId } = recordShipment(poIds(orderId)[0], "TRK-9");

    const invoice = getInvoice(invoiceId);
    expect(invoice).toMatchObject({
      orderId,
      totalCents: 4548,
      status: "SENT",
      contact: {
        givenName: "Alex",
        familyName: "Chen",
        email: "alex@example.com",
        telephone: "+1 415 555 0177",
      },
    });
    expect(invoice.invoiceDate.toISOString()).toBe("2026-10-01T09:00:00.000Z");
    expect(invoice.lines).toEqual([
      { itemId: a, quantity: 2, unitPriceCents: 1999, lineTotalCents: 3998 },
      { itemId: b, quantity: 1, unitPriceCents: 550, lineTotalCents: 550 },
    ]);
  });

  it("[SWHR3-C-0216] a PO that is not fulfilled cannot be invoiced", () => {
    const item = `INV-P${(seq += 1)}`;
    const orderId = makeOrder([[item, 2, 100]]);
    setInventory(item, 0);
    expect(allocate(orderId)).toBe("WAITING");
    const [poId] = poIds(orderId);
    const before = db.select({ n: count() }).from(supplierInvoices).get()?.n;

    expect(() => recordShipment(poId, "TRK-1")).toThrow(InvalidTransitionError);
    expect(() => withTransaction((tx) => generateInvoice(tx, poId))).toThrow(
      InvalidTransitionError,
    );

    expect(db.select({ n: count() }).from(supplierInvoices).get()?.n).toBe(before);
  });

  it("[SWHR3-C-0219] delivering the invoice records shipped quantities and completes the order", () => {
    const item = `INV-C${(seq += 1)}`;
    const orderId = makeOrder([[item, 3, 100]]);
    allocate(orderId);
    const [poId] = poIds(orderId);

    const result = withTransaction((tx) => {
      markPoShipped(tx, poId, "TRK-5");
      return receiveInvoice(tx, generateInvoice(tx, poId));
    });

    expect(result).toEqual({ orderCompleted: true });
    expect(shipped(orderId)).toEqual([{ itemId: item, shipped: 3 }]);
    expect(orderRow(orderId)).toMatchObject({ workflowStage: "SHIPPED", status: "COMPLETED" });
  });

  it("[SWHR3-C-0220] an invoice for one of two POs completes only its own lines", () => {
    const a = `INV-X${(seq += 1)}`;
    const b = `INV-Y${seq}`;
    const orderId = makeOrder([
      [a, 2, 100],
      [b, 4, 100],
    ]);
    vi.spyOn(suppliers, "supplierForItem").mockImplementation((itemId) =>
      itemId === b ? "SUPPLIER-B" : "PETSTORE-SUPPLIER",
    );
    expect(allocate(orderId)).toBe("ALLOCATED");
    const [first, second] = poIds(orderId);

    const result = recordShipment(first, "TRK-1");

    expect(result.orderCompleted).toBe(false);
    expect(shipped(orderId)).toEqual([
      { itemId: a, shipped: 2 },
      { itemId: b, shipped: 0 },
    ]);
    expect(orderRow(orderId)).toMatchObject({ workflowStage: "ALLOCATED", status: "APPROVED" });

    expect(recordShipment(second, "TRK-2").orderCompleted).toBe(true);
    expect(shipped(orderId)).toEqual([
      { itemId: a, shipped: 2 },
      { itemId: b, shipped: 4 },
    ]);
    expect(orderRow(orderId)).toMatchObject({ workflowStage: "SHIPPED", status: "COMPLETED" });
  });
});
