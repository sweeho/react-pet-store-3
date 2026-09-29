import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getAccountRole } from "./roles";
import { db } from "../db/client";
import { accounts } from "../db/schema";

/**
 * UNIT TEST (server project)
 *
 * getAccountRole reads accounts.role fresh from the db (design.md D3,
 * interface contract C1) rather than trusting anything cached elsewhere,
 * so a role change takes effect on the very next read. Each test picks its
 * own username so tests in this file never collide.
 */
function makeAccount(username: string, role?: "customer" | "admin" | "supplier") {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash", ...(role ? { role } : {}) })
    .returning({ id: accounts.id })
    .get();
}

describe("getAccountRole", () => {
  it('defaults a newly created account to "customer"', () => {
    const account = makeAccount("roles-default-1");

    expect(getAccountRole(account.id)).toBe("customer");
  });

  it('returns "admin" for an account granted the admin role', () => {
    const account = makeAccount("roles-admin-1", "admin");

    expect(getAccountRole(account.id)).toBe("admin");
  });

  it('returns "supplier" for an account granted the supplier role', () => {
    const account = makeAccount("roles-supplier-1", "supplier");

    expect(getAccountRole(account.id)).toBe("supplier");
  });

  it("reflects a role change on the very next read, without any caching", () => {
    const account = makeAccount("roles-revoke-1", "admin");
    expect(getAccountRole(account.id)).toBe("admin");

    db.update(accounts).set({ role: "customer" }).where(eq(accounts.id, account.id)).run();

    expect(getAccountRole(account.id)).toBe("customer");
  });

  it('treats an unknown accountId as "customer" rather than throwing', () => {
    expect(getAccountRole(999999)).toBe("customer");
  });
});
