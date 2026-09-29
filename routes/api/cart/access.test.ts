import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts, catalogItemDetails, catalogItems } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { createAccount } from "../../../lib/accounts";
import { isAdminApiPath, isProtectedApiPath } from "../../../lib/protected-resources";
import { startSession } from "../../../lib/session";
import authMiddleware from "../../../middleware/auth";
import cartSession from "../../../middleware/cart-session";
import deleteItem from "./[itemId].delete";
import deleteCart from "./index.delete";
import getCart from "./index.get";
import postCart from "./index.post";
import putCart from "./index.put";

/**
 * INTEGRATION TEST (server project). design.md C9/SD3: every cart endpoint
 * answers 200 with no role check, for anonymous, customer and admin callers,
 * run through both middlewares as a real request would be.
 */
type Caller = "anonymous" | "customer" | "admin";
const CALLERS: Caller[] = ["anonymous", "customer", "admin"];
const cookies: Record<Caller, string | undefined> = {
  anonymous: undefined,
  customer: undefined,
  admin: undefined,
};

async function signedInCookie(username: string, admin: boolean): Promise<string> {
  const account = await createAccount({ username, password: "correct-horse-1" });
  if (admin) db.update(accounts).set({ role: "admin" }).where(eq(accounts.id, account.id)).run();
  const event = new H3Event(new Request("http://localhost/api/session"));
  await startSession(event, { id: account.id, username });
  const cookie = event.res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
  if (!cookie) throw new Error("expected startSession to set the session cookie");
  return cookie.split(";")[0];
}

beforeAll(async () => {
  db.insert(catalogItems)
    .values([{ itemId: "EST-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 }])
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([{ itemId: "EST-1", locale: "en_US", name: "Angelfish", attribute: "Large" }])
    .onConflictDoNothing()
    .run();
  cookies.customer = await signedInCookie("accesscustomer", false);
  cookies.admin = await signedInCookie("accessadmin", true);
});

async function call(
  caller: Caller,
  method: string,
  path: string,
  body?: unknown,
  handler?: (event: H3Event) => unknown,
) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const cookie = cookies[caller];
  if (cookie) headers.cookie = cookie;
  const event = new H3Event(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  if (path.startsWith("/api/cart/")) event.context.params = { itemId: path.split("/").pop() ?? "" };
  await authMiddleware(event);
  await cartSession(event);
  const view = await handler?.(event);
  return { status: event.res.status ?? 200, view };
}

const ENDPOINTS: [string, string, unknown, (event: H3Event) => unknown][] = [
  ["GET", "/api/cart", undefined, getCart],
  ["POST", "/api/cart", { itemId: "EST-1" }, postCart],
  ["PUT", "/api/cart", { "itemQuantity_EST-1": "2" }, putCart],
  ["DELETE", "/api/cart", undefined, deleteCart],
  ["DELETE", "/api/cart/EST-1", undefined, deleteItem],
];

describe("cart access control", () => {
  it("[SWHR3-C-0081] every cart endpoint answers 200 with a CartView to an anonymous caller", async () => {
    for (const [method, path, body, handler] of ENDPOINTS) {
      const { status, view } = await call("anonymous", method, path, body, handler);
      expect(status, `${method} ${path}`).toBe(200);
      expect(view, `${method} ${path}`).toMatchObject({ items: expect.any(Array) });
    }
  });

  it.each(CALLERS)("[SWHR3-C-0082] cart endpoints answer 200 to a %s caller", async (caller) => {
    for (const [method, path, body, handler] of ENDPOINTS) {
      const { status, view } = await call(caller, method, path, body, handler);
      expect(status, `${caller} ${method} ${path}`).toBe(200);
      expect(view, `${caller} ${method} ${path}`).toMatchObject({ items: expect.any(Array) });
    }
  });

  it.each(["/api/cart", "/api/cart/EST-1"])(
    "[SWHR3-C-0082] %s is neither a protected nor an admin path",
    (path) => {
      expect(isProtectedApiPath(path)).toBe(false);
      expect(isAdminApiPath(path)).toBe(false);
    },
  );
});
