/**
 * Operator script (design.md D1, supplier-portal-and-inventory): gives an
 * existing account the supplier role. There is no UI for this — an operator
 * runs it directly.
 *
 * Usage: bun run supplier:grant <username>
 */
import { eq } from "drizzle-orm";

import { db } from "./client";
import { accounts } from "./schema";

const username = process.argv[2];

if (!username) {
  console.error("Usage: bun run supplier:grant <username>");
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

db.update(accounts).set({ role: "supplier" }).where(eq(accounts.id, account.id)).run();

console.log(`Granted supplier role to "${username}" (account id ${account.id}).`);
