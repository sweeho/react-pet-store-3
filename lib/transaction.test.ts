import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts } from "../db/schema";
import type { DbOrTx } from "./transaction";
import { withTransaction } from "./transaction";

/**
 * UNIT TEST (server project)
 *
 * Exercises withTransaction against the real in-memory db (VITEST=true
 * swaps sqlite.db for :memory:, see db/client.ts), writing rows to the
 * accounts table from SWHR3-T-0017. Each test picks its own username so
 * tests in this file never collide.
 */
function insertAccount(tx: DbOrTx, username: string) {
  tx.insert(accounts).values({ username, passwordHash: "hash" }).run();
}

function accountExists(username: string): boolean {
  return db.select().from(accounts).where(eq(accounts.username, username)).get() !== undefined;
}

describe("withTransaction", () => {
  it("commits a standalone write, making it visible afterwards (AC-1)", () => {
    withTransaction((tx) => {
      insertAccount(tx, "tx-committed");
    });

    expect(accountExists("tx-committed")).toBe(true);
  });

  it("rolls back a standalone write when fn throws, leaving no row", () => {
    expect(() =>
      withTransaction((tx) => {
        insertAccount(tx, "tx-thrown");
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(accountExists("tx-thrown")).toBe(false);
  });

  it("joins an outer transaction instead of starting a second one (AC-2)", () => {
    withTransaction((outer) => {
      insertAccount(outer, "tx-outer-a");
      withTransaction((inner) => {
        insertAccount(inner, "tx-outer-b");
      }, outer);
    });

    expect(accountExists("tx-outer-a")).toBe(true);
    expect(accountExists("tx-outer-b")).toBe(true);
  });

  it("rolling back the outer transaction removes writes made by a joined inner call", () => {
    expect(() =>
      withTransaction((outer) => {
        insertAccount(outer, "tx-nested-a");
        withTransaction((inner) => {
          insertAccount(inner, "tx-nested-b");
        }, outer);
        throw new Error("outer failed");
      }),
    ).toThrow("outer failed");

    expect(accountExists("tx-nested-a")).toBe(false);
    expect(accountExists("tx-nested-b")).toBe(false);
  });
});
