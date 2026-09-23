import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { createCustomer } from "../../../lib/customers";
import { startSession } from "../../../lib/session";
import getMe from "./me.get";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event + real session-cookie pattern as index.post.test.ts.
 */
async function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

async function signedInCookie(accountId: number, username: string): Promise<string> {
  const started = new H3Event(new Request("http://localhost/api/customers/me"));
  await startSession(started, { id: accountId, username });
  const setCookies = started.res.headers.getSetCookie();
  const sessionCookie = setCookies.find((cookie) =>
    cookie.startsWith(`${AUTH_CONFIG.sessionCookieName}=`),
  );
  if (!sessionCookie) {
    throw new Error("expected startSession to set the session cookie");
  }
  return sessionCookie.split(";")[0];
}

function completeInput(email: string) {
  const currentYear = new Date().getFullYear();
  return {
    firstName: "Alice",
    lastName: "Anderson",
    email,
    telephone: "555-0100",
    address: {
      street1: "1 Main St",
      street2: "Apt 4",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "USA",
    },
    card: {
      cardType: "Visa",
      cardNumber: "4111111111111111",
      expiryMonth: 12,
      expiryYear: currentYear + 1,
    },
    preferences: {
      locale: "en_US",
      favoriteCategory: "CATS",
      myListEnabled: true,
      petTipsEnabled: false,
    },
  };
}

function makeEvent(cookie: string | undefined): H3Event {
  return new H3Event(
    new Request("http://localhost/api/customers/me", {
      headers: cookie ? { cookie } : undefined,
    }),
  );
}

describe("GET /api/customers/me", () => {
  it("answers 401 without a session", async () => {
    await expect(getMe(makeEvent(undefined))).rejects.toMatchObject({ status: 401 });
  });

  it("answers 404 when the account has no profile", async () => {
    const account = await makeAccount("route-get-1");
    const cookie = await signedInCookie(account.id, "route-get-1");

    await expect(getMe(makeEvent(cookie))).rejects.toMatchObject({
      status: 404,
      data: { code: "NOT_FOUND" },
    });
  });

  it("answers 200 with the persisted customer profile", async () => {
    const account = await makeAccount("route-get-2");
    await createCustomer(account.id, completeInput("route-get-2@example.com"));
    const cookie = await signedInCookie(account.id, "route-get-2");

    const result = (await getMe(makeEvent(cookie))) as {
      customer: { username: string; email: string };
    };

    expect(result.customer.username).toBe("route-get-2");
    expect(result.customer.email).toBe("route-get-2@example.com");
  });
});
