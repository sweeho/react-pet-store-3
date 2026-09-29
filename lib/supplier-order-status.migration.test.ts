import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { describe, expect, it } from "vitest";

/**
 * UNIT TEST (server project). design.md D2 (supplier-portal-and-inventory):
 * migration 0007 maps existing PO statuses OPEN -> PROCESSING and SHIPPED ->
 * COMPLETED. Runs the real migration files against a scratch in-memory db:
 * first the migrations before 0007, then a PO in each old status, then the
 * rest.
 */
const MIGRATIONS = path.join(process.cwd(), "drizzle");

function scratchMigrationsUpTo(lastTag: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "migrations-"));
  cpSync(MIGRATIONS, dir, { recursive: true });
  const journalPath = path.join(dir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: Array<{ tag: string }>;
  };
  const cut = journal.entries.findIndex((entry) => entry.tag.startsWith(lastTag));
  journal.entries = journal.entries.slice(0, cut + 1);
  writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

describe("migration 0007", () => {
  it("[SWHR3-C-0198] existing POs read PROCESSING (was OPEN) and COMPLETED (was SHIPPED) afterwards", () => {
    const sqlite = new Database(":memory:");
    sqlite.run("PRAGMA foreign_keys = ON");
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: scratchMigrationsUpTo("0006") });

    sqlite.run(`INSERT INTO accounts (username, password_hash) VALUES ('mig', 'x')`);
    sqlite.run(
      `INSERT INTO orders (account_id, customer_name, order_date, total_cents) VALUES (1, 'A B', 0, 100)`,
    );
    for (const status of ["OPEN", "SHIPPED"]) {
      sqlite.run(
        `INSERT INTO supplier_purchase_orders (order_id, supplier_id, status, expected_delivery_date, created_at)
         VALUES (1, 'S', '${status}', 0, 0)`,
      );
    }

    migrate(db, { migrationsFolder: MIGRATIONS });

    const statuses = sqlite
      .query("SELECT id, status FROM supplier_purchase_orders ORDER BY id")
      .all();
    expect(statuses).toEqual([
      { id: 1, status: "PROCESSING" },
      { id: 2, status: "COMPLETED" },
    ]);
  });

  it("a PO inserted without a status defaults to PENDING", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: MIGRATIONS });
    sqlite.run(`INSERT INTO accounts (username, password_hash) VALUES ('mig2', 'x')`);
    sqlite.run(
      `INSERT INTO orders (account_id, customer_name, order_date, total_cents) VALUES (1, 'A B', 0, 100)`,
    );

    sqlite.run(
      `INSERT INTO supplier_purchase_orders (order_id, supplier_id, expected_delivery_date, created_at)
       VALUES (1, 'S', 0, 0)`,
    );

    expect(sqlite.query("SELECT status FROM supplier_purchase_orders").get()).toEqual({
      status: "PENDING",
    });
  });
});
