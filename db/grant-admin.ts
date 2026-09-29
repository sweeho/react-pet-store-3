/**
 * Operator script (design.md D12): promotes an existing account to admin.
 * There is no admin UI for this — an operator runs it directly.
 *
 * Usage: bun run admin:grant <username>
 */
import { eq } from "drizzle-orm";

import { db } from "./client";
import { accounts } from "./schema";

const username = process.argv[2];

if (!username) {
  console.error("Usage: bun run admin:grant <username>");
  process.exit(1);
}

const account = db
  .select({ id: accounts.id })
  .from(accounts)
  .where(eq(accounts.username, username))
  .get();

if (!account) {
  console.error(`No account found with user name "${username}"`);
  process.exit(1);
}

db.update(accounts).set({ role: "admin" }).where(eq(accounts.id, account.id)).run();

console.log(`Granted admin role to "${username}" (account id ${account.id}).`);
