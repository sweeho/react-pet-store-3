import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts } from "../../../db/schema";
import registerHandler from "./register.post";

/**
 * INTEGRATION TEST (server project)
 *
 * Pins design.md SD22: two simultaneous POST /api/auth/register calls for
 * the same user name resolve to exactly one 201 and one 409
 * DUPLICATE_ACCOUNT, and exactly one accounts row — SQLite serialises
 * writers, so the unique index on accounts.username decides the race
 * (lib/accounts.ts's createAccount, not a pre-check select). Real H3Events,
 * same pattern as routes/api/auth/register.post.test.ts, run through
 * Promise.allSettled so neither call short-circuits the other.
 */
function makeRegisterEvent(body: unknown): H3Event {
  return new H3Event(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/auth/register concurrency (SD22)", () => {
  it("two simultaneous registrations for the same user name: one 201, one 409 DUPLICATE_ACCOUNT, one account row", async () => {
    const username = "concurrent1";
    const body = {
      j_username: username,
      j_password: "correct-horse-1",
      j_password_confirm: "correct-horse-1",
    };

    const results = await Promise.allSettled([
      registerHandler(makeRegisterEvent(body)),
      registerHandler(makeRegisterEvent(body)),
    ]);

    const fulfilled = results.filter(
      (result) => result.status === "fulfilled",
    ) as PromiseFulfilledResult<Awaited<ReturnType<typeof registerHandler>>>[];
    const rejected = results.filter(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult[];

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(fulfilled[0].value).toMatchObject({ user: { username } });
    expect(rejected[0].reason).toMatchObject({
      status: 409,
      data: { code: "DUPLICATE_ACCOUNT" },
    });

    const rows = db.select().from(accounts).where(eq(accounts.username, username)).all();
    expect(rows).toHaveLength(1);
  });
});
