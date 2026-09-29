import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  inventory,
  lineItems,
  orders,
  supplierInvoices,
  supplierPoAddresses,
  supplierPoContacts,
  supplierPurchaseOrders,
} from "../db/schema";
import type { ContactInfo } from "./contact-info";
import { createCreditCard } from "./credit-card";
import { setInventory } from "./inventory";
import { applyInventoryUpdate } from "./inventory-update";
import { updateOrders } from "./order-approval";
import { processOrder } from "./order-processing";
import { recordShipment } from "./process-manager";

/**
 * UNIT TEST (server project). design.md D3, D5, D6, D9 (supplier-portal-and-
 * inventory): the whole chain in one test, from approval through a PENDING
 * PO, a supplier stock update, fulfilment, shipment and its invoice, to a
 * completed order. Proof only: no production file changes.
 */
const BILL_TO: ContactInfo = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1 Main St",
  address2: null,
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "USA",
  telephoneNumber: "555-0100",
  email: "sarah.chen@example.com",
};
const EVENT = {
  shipper: BILL_TO,
  receiver: { ...BILL_TO, givenName: "Alex", address1: "88 Market Street", city: "San Francisco" },
  creditCard: createCreditCard("4111 1111 1111 4412", "Java Card", 3, 2030),
};

let accountId: number;

beforeAll(() => {
  accountId = db
    .insert(accounts)
    .values({ username: "supplier-workflow-user", passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get().id;
  db.insert(catalogItems)
    .values({ itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1999 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values({ itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" })
    .onConflictDoNothing()
    .run();
});

describe("supplier workflow", () => {
  it("[SWHR3-C-0217] runs from approval to a completed order", () => {
    const cartToken = randomUUID();
    db.insert(cartItems).values({ sessionToken: cartToken, itemId: "EST-1", quantity: 2 }).run();
    const { orderId } = processOrder({ accountId, cartToken, locale: "en_US", event: EVENT });
    setInventory("EST-1", 0);
    const order = () => db.select().from(orders).where(eq(orders.id, orderId)).get();
    const pos = () =>
      db
        .select()
        .from(supplierPurchaseOrders)
        .where(eq(supplierPurchaseOrders.orderId, orderId))
        .all();
    const stock = () =>
      db.select().from(inventory).where(eq(inventory.itemId, "EST-1")).get()?.quantity;
    expect(order()?.workflowStage).toBe("CONFIRMED");

    // Approval with no stock: the order waits with one PENDING PO carrying its delivery contact and address.
    updateOrders({ changes: [{ orderId, status: "APPROVED" }] });
    expect(order()).toMatchObject({ status: "APPROVED", workflowStage: "CONFIRMED" });
    expect(pos()).toHaveLength(1);
    const poId = pos()[0].id;
    expect(pos()[0].status).toBe("PENDING");
    expect(
      db.select().from(supplierPoContacts).where(eq(supplierPoContacts.supplierPoId, poId)).get(),
    ).toMatchObject({ givenName: "Alex", email: "sarah.chen@example.com" });
    expect(
      db.select().from(supplierPoAddresses).where(eq(supplierPoAddresses.supplierPoId, poId)).get(),
    ).toMatchObject({ address1: "88 Market Street", city: "San Francisco" });
    expect(stock()).toBe(0);

    // The supplier adds stock: the PO is fulfilled and the order allocated.
    const update = applyInventoryUpdate([{ itemId: "EST-1", quantity: 5 }]);
    expect(update.fulfilledOrders).toBeGreaterThanOrEqual(1);
    expect(pos()[0].status).toBe("PROCESSING");
    expect(stock()).toBe(3);
    expect(order()?.workflowStage).toBe("ALLOCATED");

    // The supplier ships: the PO completes, an invoice is issued and delivered, the order completes.
    const shipment = recordShipment(poId, "TRK-1");
    expect(shipment).toMatchObject({ orderCompleted: true, invoiceId: expect.any(Number) });
    expect(pos()[0]).toMatchObject({ status: "COMPLETED", trackingNumber: "TRK-1" });
    expect(
      db.select().from(supplierInvoices).where(eq(supplierInvoices.supplierPoId, poId)).all(),
    ).toHaveLength(1);
    expect(
      db
        .select()
        .from(lineItems)
        .where(eq(lineItems.orderId, orderId))
        .all()
        .map((l) => l.quantityShipped),
    ).toEqual([2]);
    expect(order()).toMatchObject({ workflowStage: "SHIPPED", status: "COMPLETED" });
  });
});
