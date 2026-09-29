/**
 * Operator/E2E script (design.md D12): inserts orders for an existing
 * account and prints their ids as JSON on the last line of stdout, e.g.
 * {"orderIds":[12,13]}. Orders are always at or above $500.00 (the amount
 * at which they wait for approval).
 *
 * Usage: bun db/seed-orders.ts --username <name> [--count <n>] [--status <STATUS>]
 */
import { eq, sql } from "drizzle-orm";

import { isOrderStatus } from "../lib/order-status";
import type { OrderStatus } from "../lib/order-status";
import { db } from "./client";
import { accounts, orders } from "./schema";

const MIN_TOTAL_CENTS = 50_000;

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function fail(message: string): never {
  console.error(message);
  console.error("Usage: bun db/seed-orders.ts --username <name> [--count <n>] [--status <STATUS>]");
  process.exit(1);
}

const username = argValue("--username");
if (!username) {
  fail("--username is required");
}

const count = Number(argValue("--count") ?? "1");
if (!Number.isInteger(count) || count < 1 || count > 500) {
  fail("--count must be an integer from 1 to 500");
}

const statusArg = argValue("--status") ?? "PENDING";
if (!isOrderStatus(statusArg)) {
  fail(`--status must be one of PENDING, APPROVED, DENIED, COMPLETED (got "${statusArg}")`);
}
const status: OrderStatus = statusArg;

// Concurrent seeders (parallel E2E workers) share one sqlite file; wait for
// the write lock instead of failing with SQLITE_BUSY.
db.run(sql`PRAGMA busy_timeout = 10000`);

const account = db
  .select({ id: accounts.id })
  .from(accounts)
  .where(eq(accounts.username, username))
  .get();
if (!account) {
  fail(`No account found with user name "${username}"`);
}

const now = Date.now();
const orderIds = Array.from({ length: count }, (_, index) => {
  const row = db
    .insert(orders)
    .values({
      accountId: account.id,
      customerName: `Seed ${username}`,
      orderDate: new Date(now - (count - index) * 60_000),
      totalCents: MIN_TOTAL_CENTS + index * 2_500,
      status,
    })
    .returning({ id: orders.id })
    .get();
  return row.id;
});

console.log(JSON.stringify({ orderIds }));
