import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import getAdminOrders from "../routes/api/admin/orders/index.get";
import { db } from "../db/client";
import { accounts, orders } from "../db/schema";
import { AUTH_CONFIG } from "../lib/auth-config";
import { startSession } from "../lib/session";
import authMiddleware from "./auth";

/**
 * INTEGRATION TEST (server project)
 *
 * Same real-H3Event pattern as lib/session.test.ts: a prior call's sealed
 * cookie is read back as the next event's incoming Cookie header. Covers
 * the none/expired/active cases on both a protected and a non-protected
 * path (design.md D7, AC-6, AC-7).
 */
function makeEvent(pathname: string, cookieHeader?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost${pathname}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    }),
  );
}

function extractSessionCookieHeader(event: H3Event): string {
  const setCookies = event.res.headers.getSetCookie();
  const sessionCookie = setCookies.find((cookie) =>
    cookie.startsWith(`${AUTH_CONFIG.sessionCookieName}=`),
  );
  if (!sessionCookie) {
    throw new Error("expected startSession to set the session cookie");
  }
  return sessionCookie.split(";")[0];
}

const USER = { id: 7, username: "jgarrett" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("auth middleware", () => {
  it("sets event.context.user/locale for an active session, on a protected path", async () => {
    const started = makeEvent("/api/customers");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    const event = makeEvent("/api/customers", cookie);

    await authMiddleware(event);

    expect(event.context.user).toEqual(USER);
    expect(event.context.locale).toBe("en_US");
  });

  it("throws 401 'Authentication required' on a protected path with no session", async () => {
    const event = makeEvent("/api/customers");

    await expect(authMiddleware(event)).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("throws 401 'Session timed out' on a protected path with an expired session", async () => {
    const started = makeEvent("/api/customers/me");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    await expect(authMiddleware(makeEvent("/api/customers/me", cookie))).rejects.toMatchObject({
      status: 401,
      message: "Session timed out",
    });
  });

  it("does not throw on a non-protected path with no session, and leaves context.user undefined", async () => {
    const event = makeEvent("/api/hello");

    await expect(authMiddleware(event)).resolves.toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("still attaches context.user on a non-protected path when a session is active", async () => {
    const started = makeEvent("/api/hello");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    const event = makeEvent("/api/hello", cookie);

    await authMiddleware(event);

    expect(event.context.user).toEqual(USER);
  });
});

/**
 * design.md D4/C6: /api/admin/** is admin-only by prefix. No session still
 * gets the existing 401; a signed-in non-admin gets 403 FORBIDDEN; a role
 * revoked mid-session is enforced on the very next request, with no
 * sign-out required (the role is read from the db, never the cookie).
 */
function makeAccount(username: string, role?: "customer" | "admin" | "supplier") {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash", ...(role ? { role } : {}) })
    .returning({ id: accounts.id })
    .get();
}

async function signedInEvent(pathname: string, accountId: number, username: string) {
  const started = makeEvent(pathname);
  await startSession(started, { id: accountId, username });
  const cookie = extractSessionCookieHeader(started);
  return makeEvent(pathname, cookie);
}

describe("auth middleware — admin paths", () => {
  it("throws 401 'Authentication required' on an admin path with no session", async () => {
    const event = makeEvent("/api/admin/orders");

    await expect(authMiddleware(event)).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("[SWHR3-C-0026] throws 403 FORBIDDEN for a signed-in non-admin, on the commit endpoint, leaving the order untouched", async () => {
    const account = makeAccount("admin-mw-customer-1", "customer");
    const order = db
      .insert(orders)
      .values({
        accountId: account.id,
        customerName: "Alice Anderson",
        orderDate: new Date("2026-01-01T00:00:00.000Z"),
        totalCents: 1999,
        status: "PENDING",
      })
      .returning()
      .get();
    const event = await signedInEvent(
      "/api/admin/orders/status",
      account.id,
      "admin-mw-customer-1",
    );

    await expect(authMiddleware(event)).rejects.toMatchObject({
      status: 403,
      message: "Administrator credentials required",
      data: { code: "FORBIDDEN" },
    });

    const stillPending = db.select().from(orders).where(eq(orders.id, order.id)).get();
    expect(stillPending?.status).toBe("PENDING");
  });

  it("passes through for a signed-in admin, without throwing", async () => {
    const account = makeAccount("admin-mw-admin-1", "admin");
    const event = await signedInEvent("/api/admin/orders", account.id, "admin-mw-admin-1");

    await expect(authMiddleware(event)).resolves.toBeUndefined();
    expect(event.context.user).toEqual({ id: account.id, username: "admin-mw-admin-1" });
  });

  it("[SWHR3-C-0029] lets an admin's session cookie reach GET /api/admin/orders (200), and rejects no cookie (401)", async () => {
    const account = makeAccount("admin-mw-admin-2", "admin");
    const withCookie = await signedInEvent("/api/admin/orders", account.id, "admin-mw-admin-2");

    await authMiddleware(withCookie);
    const result = (await getAdminOrders(withCookie)) as { orders: Record<string, unknown[]> };
    expect(Object.keys(result.orders).sort()).toEqual([
      "APPROVED",
      "COMPLETED",
      "DENIED",
      "PENDING",
    ]);

    const withoutCookie = makeEvent("/api/admin/orders");
    await expect(authMiddleware(withoutCookie)).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("enforces a revoked admin role on the very next request, without signing out", async () => {
    const account = makeAccount("admin-mw-revoke-1", "admin");
    const started = makeEvent("/api/admin/orders");
    await startSession(started, { id: account.id, username: "admin-mw-revoke-1" });
    const cookie = extractSessionCookieHeader(started);
    await authMiddleware(makeEvent("/api/admin/orders", cookie));

    db.update(accounts).set({ role: "customer" }).where(eq(accounts.id, account.id)).run();

    await expect(authMiddleware(makeEvent("/api/admin/orders", cookie))).rejects.toMatchObject({
      status: 403,
    });
  });

  it("still enforces the existing exact-match customer paths under the admin prefix change", async () => {
    const event = makeEvent("/api/customers");

    await expect(authMiddleware(event)).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });
});

/**
 * design.md D1: /api/supplier/** is for the supplier role only, store
 * administrators included. The role is read from the db on every request.
 */
describe("auth middleware — supplier paths", () => {
  const PATH = "/api/supplier/inventory";
  const ADMIN_PATH = "/api/admin/orders";

  it("[SWHR3-C-0224] answers 401 with no session", async () => {
    await expect(authMiddleware(makeEvent(PATH))).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it.each(["customer", "admin"] as const)(
    "[SWHR3-C-0224] answers 403 FORBIDDEN for a %s",
    async (role) => {
      const name = `supplier-mw-${role}`;
      const account = makeAccount(name, role);
      const event = await signedInEvent(PATH, account.id, name);

      await expect(authMiddleware(event)).rejects.toMatchObject({
        status: 403,
        message: "Supplier administrator credentials required",
        data: { code: "FORBIDDEN" },
      });
    },
  );

  it("[SWHR3-C-0224] lets a supplier through, and refuses the supplier on an admin path", async () => {
    const account = makeAccount("supplier-mw-supplier", "supplier");
    const allowed = await signedInEvent(PATH, account.id, "supplier-mw-supplier");

    await expect(authMiddleware(allowed)).resolves.toBeUndefined();
    expect(allowed.context.user).toEqual({ id: account.id, username: "supplier-mw-supplier" });

    const onAdmin = await signedInEvent(ADMIN_PATH, account.id, "supplier-mw-supplier");
    await expect(authMiddleware(onAdmin)).rejects.toMatchObject({
      status: 403,
      data: { code: "FORBIDDEN" },
    });
  });

  it("[SWHR3-C-0225] a revoked supplier role takes effect on the next request", async () => {
    const account = makeAccount("supplier-mw-revoke", "supplier");
    const started = makeEvent(PATH);
    await startSession(started, { id: account.id, username: "supplier-mw-revoke" });
    const cookie = extractSessionCookieHeader(started);
    await expect(authMiddleware(makeEvent(PATH, cookie))).resolves.toBeUndefined();

    db.update(accounts).set({ role: "customer" }).where(eq(accounts.id, account.id)).run();

    await expect(authMiddleware(makeEvent(PATH, cookie))).rejects.toMatchObject({
      status: 403,
      data: { code: "FORBIDDEN" },
    });
  });
});
