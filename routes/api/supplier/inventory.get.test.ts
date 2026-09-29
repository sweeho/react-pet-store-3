import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts, catalogItems } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { setInventory } from "../../../lib/inventory";
import { startSession } from "../../../lib/session";
import authMiddleware from "../../../middleware/auth";
import getInventory from "./inventory.get";

/**
 * INTEGRATION TEST (server project). design.md D1, C10 (supplier-portal-and-
 * inventory): GET /api/supplier/inventory lists every catalogue item with its
 * quantity. Access is the auth middleware's prefix rule (supplier role only,
 * read from the db on every request), so each call runs middleware then handler.
 */
type Role = "customer" | "admin" | "supplier";

function makeAccount(username: string, role: Role) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash", role })
    .returning({ id: accounts.id })
    .get();
}

function makeEvent(pathname: string, cookie?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost${pathname}`, { headers: cookie ? { cookie } : undefined }),
  );
}

async function sessionCookie(accountId: number, username: string): Promise<string> {
  const started = makeEvent("/api/supplier/inventory");
  await startSession(started, { id: accountId, username });
  const cookie = started.res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
  if (!cookie) {
    throw new Error("expected startSession to set the session cookie");
  }
  return cookie.split(";")[0];
}

async function callInventory(cookie?: string): Promise<unknown> {
  const event = makeEvent("/api/supplier/inventory", cookie);
  await authMiddleware(event);
  return getInventory(event);
}

beforeAll(() => {
  db.insert(catalogItems)
    .values([
      { itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "EST-2", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 },
      { itemId: "EST-3", productId: "K9-BD-01", category: "DOGS", unitCostCents: 1850 },
    ])
    .onConflictDoNothing()
    .run();
  setInventory("EST-1", 4);
  setInventory("EST-3", 9);
});

describe("GET /api/supplier/inventory", () => {
  it("[SWHR3-C-0227] returns every catalogue item with its quantity, in item order", async () => {
    const supplier = makeAccount("inv-supplier-1", "supplier");
    const cookie = await sessionCookie(supplier.id, "inv-supplier-1");

    const result = (await callInventory(cookie)) as {
      items: Array<{ itemId: string; quantity: number }>;
    };

    expect(result.items).toEqual([
      { itemId: "EST-1", quantity: 4 },
      { itemId: "EST-2", quantity: 0 },
      { itemId: "EST-3", quantity: 9 },
    ]);
  });

  it("[SWHR3-C-0224] only the supplier role reaches the supplier API", async () => {
    const customer = makeAccount("inv-customer", "customer");
    const admin = makeAccount("inv-admin", "admin");
    const supplier = makeAccount("inv-supplier-2", "supplier");

    await expect(callInventory()).rejects.toMatchObject({ status: 401 });
    await expect(
      callInventory(await sessionCookie(customer.id, "inv-customer")),
    ).rejects.toMatchObject({ status: 403, data: { code: "FORBIDDEN" } });
    await expect(callInventory(await sessionCookie(admin.id, "inv-admin"))).rejects.toMatchObject({
      status: 403,
      data: { code: "FORBIDDEN" },
    });
    const supplierCookie = await sessionCookie(supplier.id, "inv-supplier-2");
    await expect(callInventory(supplierCookie)).resolves.toEqual({
      items: expect.any(Array),
    });

    const adminOrders = makeEvent("/api/admin/orders", supplierCookie);
    await expect(authMiddleware(adminOrders)).rejects.toMatchObject({ status: 403 });
  });

  it("[SWHR3-C-0225] a revoked supplier role takes effect on the next request", async () => {
    const supplier = makeAccount("inv-supplier-3", "supplier");
    const cookie = await sessionCookie(supplier.id, "inv-supplier-3");

    await expect(callInventory(cookie)).resolves.toEqual({ items: expect.any(Array) });
    db.update(accounts).set({ role: "customer" }).where(eq(accounts.id, supplier.id)).run();

    await expect(callInventory(cookie)).rejects.toMatchObject({ status: 403 });
  });
});
