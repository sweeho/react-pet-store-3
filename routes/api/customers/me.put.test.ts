import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { createCustomer } from "../../../lib/customers";
import { startSession } from "../../../lib/session";
import putMe from "./me.put";

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

function completeBody(email: string, overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function makeEvent(cookie: string | undefined, body: unknown): H3Event {
  return new H3Event(
    new Request("http://localhost/api/customers/me", {
      method: "PUT",
      headers: {
        ...(cookie ? { cookie } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("PUT /api/customers/me", () => {
  it("answers 401 without a session", async () => {
    await expect(
      putMe(makeEvent(undefined, completeBody("noauth@example.com"))),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("answers 404 when the account has no profile", async () => {
    const account = await makeAccount("route-put-1");
    const cookie = await signedInCookie(account.id, "route-put-1");

    await expect(
      putMe(makeEvent(cookie, completeBody("route-put-1@example.com"))),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("answers 200 and persists the update", async () => {
    const account = await makeAccount("route-put-2");
    const cookie = await signedInCookie(account.id, "route-put-2");
    await createCustomer(account.id, completeBody("route-put-2@example.com"));

    const result = (await putMe(
      makeEvent(cookie, completeBody("route-put-2-new@example.com", { firstName: "Alicia" })),
    )) as { customer: { firstName: string; email: string } };

    expect(result.customer.firstName).toBe("Alicia");
    expect(result.customer.email).toBe("route-put-2-new@example.com");
  });

  it("answers 409 DUPLICATE_EMAIL when another customer already uses the new email", async () => {
    const accountA = await makeAccount("route-put-3a");
    const accountB = await makeAccount("route-put-3b");
    await createCustomer(accountA.id, completeBody("route-put-taken@example.com"));
    await createCustomer(accountB.id, completeBody("route-put-3b@example.com"));
    const cookieB = await signedInCookie(accountB.id, "route-put-3b");

    await expect(
      putMe(makeEvent(cookieB, completeBody("route-put-taken@example.com"))),
    ).rejects.toMatchObject({ status: 409, data: { code: "DUPLICATE_EMAIL" } });
  });

  it("answers 422 for an incomplete body", async () => {
    const account = await makeAccount("route-put-4");
    const cookie = await signedInCookie(account.id, "route-put-4");
    await createCustomer(account.id, completeBody("route-put-4@example.com"));

    await expect(putMe(makeEvent(cookie, {}))).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED" },
    });
  });
});
