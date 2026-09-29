import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import {
  accounts,
  catalogItems,
  inventory,
  lineItems,
  orderContacts,
  orders,
  supplierPurchaseOrders,
} from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { getInventoryItem, setInventory } from "../../../lib/inventory";
import { allocateOrder } from "../../../lib/process-manager";
import { startSession } from "../../../lib/session";
import { withTransaction } from "../../../lib/transaction";
import authMiddleware from "../../../middleware/auth";
import postInventory from "./inventory.post";

/**
 * INTEGRATION TEST (server project). design.md D6, D7, C10 (supplier-portal-
 * and-inventory): POST /api/supplier/inventory applies the form's ticked,
 * valid rows atomically and reprocesses pending POs. Role access is the auth
 * middleware's, so each call runs middleware then handler.
 */
type Role = "customer" | "supplier";

let supplierCookie: string;
let customerCookie: string;

async function cookieFor(username: string, role: Role): Promise<string> {
  const { id } = db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash", role })
    .returning({ id: accounts.id })
    .get();
  const started = new H3Event(new Request("http://localhost/api/supplier/inventory"));
  await startSession(started, { id, username });
  const cookie = started.res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
  if (!cookie) {
    throw new Error("expected startSession to set the session cookie");
  }
  return cookie.split(";")[0];
}

beforeAll(async () => {
  db.insert(catalogItems)
    .values(
      ["EST-1", "EST-2", "EST-3"].map((itemId) => ({
        itemId,
        productId: "FI-SW-01",
        category: "FISH",
        unitCostCents: 1650,
      })),
    )
    .onConflictDoNothing()
    .run();
  supplierCookie = await cookieFor("post-inv-supplier", "supplier");
  customerCookie = await cookieFor("post-inv-customer", "customer");
});

async function post(
  body: unknown,
  cookie: string | undefined = supplierCookie,
  contentType = "application/json",
): Promise<unknown> {
  const event = new H3Event(
    new Request("http://localhost/api/supplier/inventory", {
      method: "POST",
      headers: { "content-type": contentType, ...(cookie ? { cookie } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  await authMiddleware(event);
  return postInventory(event);
}

const stock = (itemId: string) => getInventoryItem(itemId).quantity;

describe("POST /api/supplier/inventory", () => {
  it("[SWHR3-C-0191] ticked rows update stock and reprocess pending supplier orders", async () => {
    setInventory("EST-2", 0);
    const { id: accountId } = db
      .insert(accounts)
      .values({ username: "post-inv-buyer", passwordHash: "not-a-real-hash" })
      .returning({ id: accounts.id })
      .get();
    const orderId = db
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
        orderId,
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
    db.insert(lineItems)
      .values({
        orderId,
        lineNumber: 1,
        categoryId: "FISH",
        productId: "FI-SW-01",
        itemId: "EST-2",
        quantity: 2,
        unitPriceCents: 1650,
      })
      .run();
    expect(withTransaction((tx) => allocateOrder(tx, orderId))).toBe("WAITING");
    const po = () =>
      db
        .select()
        .from(supplierPurchaseOrders)
        .where(eq(supplierPurchaseOrders.orderId, orderId))
        .get();
    expect(po()?.status).toBe("PENDING");

    const result = await post({ "qty_EST-2": "5", "item_EST-2": "on" });

    expect(result).toMatchObject({
      updated: ["EST-2"],
      fulfilledOrders: 1,
      inventory: expect.arrayContaining([{ itemId: "EST-2", quantity: 3 }]),
    });
    expect(stock("EST-2")).toBe(3);
    expect(po()?.status).toBe("PROCESSING");
  });

  it("two ticked valid rows and one unticked row update exactly two items", async () => {
    setInventory("EST-1", 1);
    setInventory("EST-2", 2);
    setInventory("EST-3", 3);

    const result = (await post({
      "qty_EST-1": "10",
      "item_EST-1": "on",
      "qty_EST-2": "20",
      "item_EST-2": true,
      "qty_EST-3": "30",
    })) as { updated: string[] };

    expect(result.updated.sort()).toEqual(["EST-1", "EST-2"]);
    expect([stock("EST-1"), stock("EST-2"), stock("EST-3")]).toEqual([10, 20, 3]);
  });

  it("[SWHR3-C-0196] an invalid ticked row gets no error and leaves stock unchanged", async () => {
    setInventory("EST-2", 40);

    const result = await post({ "qty_EST-2": "abc", "item_EST-2": "on" });

    expect(result).toMatchObject({ updated: [] });
    expect(result).not.toHaveProperty("error");
    expect(stock("EST-2")).toBe(40);
  });

  it("[SWHR3-C-0210] a negative quantity is skipped and stock is unchanged", async () => {
    setInventory("EST-2", 40);

    const result = await post({
      "qty_EST-2": "-3",
      "item_EST-2": "on",
      "qty_EST-1": "9",
      "item_EST-1": "on",
    });

    expect(result).toMatchObject({ updated: ["EST-1"] });
    expect(stock("EST-2")).toBe(40);
    expect(stock("EST-1")).toBe(9);
  });

  it("a non-JSON body gets 415", async () => {
    await expect(
      post("qty_EST-1=5&item_EST-1=on", supplierCookie, "application/x-www-form-urlencoded"),
    ).rejects.toMatchObject({ status: 415 });
  });

  it("a customer gets 403 and a signed-out caller 401, with stock unchanged", async () => {
    setInventory("EST-1", 7);

    await expect(
      post({ "qty_EST-1": "99", "item_EST-1": "on" }, customerCookie),
    ).rejects.toMatchObject({ status: 403 });
    await expect(post({ "qty_EST-1": "99", "item_EST-1": "on" }, "")).rejects.toMatchObject({
      status: 401,
    });
    expect(stock("EST-1")).toBe(7);
    expect(db.select().from(inventory).where(eq(inventory.itemId, "EST-1")).get()?.quantity).toBe(
      7,
    );
  });
});
