import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import {
  accounts,
  cartItems,
  catalogItemDetails,
  catalogItems,
  creditCards,
  customers,
  inventory,
  inventoryReservations,
  lineItems,
  notificationOutbox,
  orderContacts,
  orderStageHistory,
  orders,
  paymentAuthorizations,
  supplierFulfilmentAttempts,
  supplierInvoices,
  supplierPoAddresses,
  supplierPoContacts,
  supplierPurchaseOrders,
  users,
} from "./schema";

// Opens a connection with the pragmas every connection needs. Bun's defaults
// are busy_timeout 0 and journal_mode delete, so a lock held by another
// process (operator scripts, a second instance) fails at once with "database
// is locked". The busy timeout is set first so it also covers migrate().
export function openDatabase(file: string): Database {
  const database = new Database(file);
  database.exec("PRAGMA busy_timeout = 5000");
  // WAL lets readers proceed alongside a writer; it does not apply in memory.
  // Not asserted: a concurrent old process may delay the switch (busy_timeout
  // still covers contention meanwhile).
  if (file !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL");
  }
  // bun:sqlite does not enforce foreign keys by default; creditCards'
  // ON DELETE CASCADE to customers (D8) needs this on for every connection.
  database.exec("PRAGMA foreign_keys = ON");
  return database;
}

// Vitest sets VITEST=true in every worker; an in-memory db keeps route
// integration tests isolated from the file-backed dev/prod db and from
// each other (each test module gets its own fresh Database instance).
// Paths are cwd-relative rather than import.meta.url-relative because Vite
// (dev server, Nitro build, Vitest) transforms this module, so its
// import.meta.url isn't a real file:// URL — cwd is always the project root
// across dev/build/test.
const sqlite = openDatabase(
  process.env.VITEST ? ":memory:" : path.join(process.cwd(), "sqlite.db"),
);

export const db = drizzle(sqlite, {
  schema: {
    users,
    accounts,
    customers,
    creditCards,
    orders,
    cartItems,
    catalogItems,
    catalogItemDetails,
    lineItems,
    orderContacts,
    orderStageHistory,
    paymentAuthorizations,
    notificationOutbox,
    inventory,
    inventoryReservations,
    supplierPurchaseOrders,
    supplierPoContacts,
    supplierPoAddresses,
    supplierInvoices,
    supplierFulfilmentAttempts,
  },
});

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Seed the same two users the mock API used to hardcode, so the demo data
// (and the existing route tests) keep working out of the box.
if (db.select().from(users).all().length === 0) {
  db.insert(users)
    .values([
      { name: "John Doe", email: "john@example.com" },
      { name: "Jane Smith", email: "jane@example.com" },
    ])
    .run();
}
