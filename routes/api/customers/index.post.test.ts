import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { accounts } from "../../../db/schema";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { startSession } from "../../../lib/session";
import createCustomerRoute from "./index.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/hello.test.ts, with a real
 * sealed session cookie from lib/session.ts (SWHR3-T-0010) standing in for
 * an authenticated request.
 */
async function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

async function signedInCookie(accountId: number, username: string): Promise<string> {
  const started = new H3Event(new Request("http://localhost/api/customers"));
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
    new Request("http://localhost/api/customers", {
      method: "POST",
      headers: {
        ...(cookie ? { cookie } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/customers", () => {
  it("answers 401 without a session", async () => {
    const event = makeEvent(undefined, completeBody("noauth@example.com"));

    await expect(createCustomerRoute(event)).rejects.toMatchObject({ status: 401 });
  });

  it("answers 201 with the created customer profile", async () => {
    const account = await makeAccount("route-create-1");
    const cookie = await signedInCookie(account.id, "route-create-1");

    const result = (await createCustomerRoute(
      makeEvent(cookie, completeBody("route-create-1@example.com")),
    )) as { customer: { username: string; email: string; card: { cardNumberLast4: string } } };

    expect(result.customer.username).toBe("route-create-1");
    expect(result.customer.email).toBe("route-create-1@example.com");
    expect(result.customer.card.cardNumberLast4).toBe("1111");
  });

  it("answers 409 PROFILE_EXISTS on a second create for the same account", async () => {
    const account = await makeAccount("route-create-2");
    const cookie = await signedInCookie(account.id, "route-create-2");
    await createCustomerRoute(makeEvent(cookie, completeBody("route-create-2@example.com")));

    await expect(
      createCustomerRoute(makeEvent(cookie, completeBody("route-create-2-again@example.com"))),
    ).rejects.toMatchObject({ status: 409, data: { code: "PROFILE_EXISTS" } });
  });

  it("answers 409 DUPLICATE_EMAIL when another customer already uses the email", async () => {
    const accountA = await makeAccount("route-create-3a");
    const accountB = await makeAccount("route-create-3b");
    await createCustomerRoute(
      makeEvent(
        await signedInCookie(accountA.id, "route-create-3a"),
        completeBody("shared@example.com"),
      ),
    );

    await expect(
      createCustomerRoute(
        makeEvent(
          await signedInCookie(accountB.id, "route-create-3b"),
          completeBody("shared@example.com"),
        ),
      ),
    ).rejects.toMatchObject({ status: 409, data: { code: "DUPLICATE_EMAIL" } });
  });

  it("answers 422 for an incomplete body", async () => {
    const account = await makeAccount("route-create-4");
    const cookie = await signedInCookie(account.id, "route-create-4");

    await expect(createCustomerRoute(makeEvent(cookie, {}))).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED" },
    });
  });
});
