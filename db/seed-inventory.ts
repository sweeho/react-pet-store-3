/**
 * Operator/E2E script (design.md C6): sets inventory quantities and prints
 * the affected item ids as JSON on the last line of stdout, e.g.
 * {"itemIds":["EST-1"],"quantity":10}.
 *
 * Usage: bun db/seed-inventory.ts --item <id> --quantity <n>
 *        bun db/seed-inventory.ts --all <n>
 */
import { sql } from "drizzle-orm";

import { setInventory } from "../lib/inventory";
import { db } from "./client";
import { catalogItems } from "./schema";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function fail(message: string): never {
  console.error(message);
  console.error("Usage: bun db/seed-inventory.ts --item <id> --quantity <n> | --all <n>");
  process.exit(1);
}

function parseQuantity(value: string | undefined, flag: string): number {
  const quantity = Number(value);
  if (value === undefined || !Number.isInteger(quantity) || quantity < 0) {
    fail(`${flag} must be a non-negative integer`);
  }
  return quantity;
}

const item = argValue("--item");
const all = argValue("--all");
if ((item === undefined) === (all === undefined)) {
  fail("Give either --item with --quantity, or --all");
}
const quantity =
  item !== undefined
    ? parseQuantity(argValue("--quantity"), "--quantity")
    : parseQuantity(all, "--all");

// Concurrent seeders (parallel E2E workers) share one sqlite file; wait for
// the write lock instead of failing with SQLITE_BUSY.
db.run(sql`PRAGMA busy_timeout = 10000`);

const itemIds = db.transaction((tx) => {
  const ids =
    item !== undefined
      ? [item]
      : tx
          .select({ itemId: catalogItems.itemId })
          .from(catalogItems)
          .all()
          .map((row) => row.itemId);
  if (
    item !== undefined &&
    !tx
      .select()
      .from(catalogItems)
      .where(sql`${catalogItems.itemId} = ${item}`)
      .get()
  ) {
    fail(`No catalogue item "${item}" (run db/seed-catalog.ts first)`);
  }
  for (const itemId of ids) {
    setInventory(itemId, quantity, tx);
  }
  return ids;
});

console.log(JSON.stringify({ itemIds, quantity }));
