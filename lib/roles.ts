/**
 * Reads an account's role fresh per request (design.md D3, interface
 * contract C1) rather than trusting anything cached in the session cookie,
 * so a revoked role takes effect on the very next request.
 */
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { accounts } from "../db/schema";

export type AccountRole = "customer" | "admin";

export function getAccountRole(accountId: number): AccountRole {
  const account = db
    .select({ role: accounts.role })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .get();

  return account?.role === "admin" ? "admin" : "customer";
}
