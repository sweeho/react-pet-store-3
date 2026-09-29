import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import signIn from "./auth/signin.post";
import getSession from "./session.get";
import { db } from "../../db/client";
import { accounts } from "../../db/schema";
import { AUTH_CONFIG } from "../../lib/auth-config";
import { createAccount } from "../../lib/accounts";
import { startSession } from "../../lib/session";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/hello.test.ts. GET /api/session
 * never 401s (design.md C9) — it answers { user, locale, expired } for
 * every session state.
 */
function makeEvent(cookieHeader?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/session", {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    }),
  );
}

function extractSessionCookieHeader(event: H3Event): string {
  const setCookies = event.res.headers.getSetCookie();
  const sessionCookie = setCookies.find((cookie) =>
    cookie.startsWith(`${AUTH_CONFIG.sessionCookieName}=`),
  );
  if (!sessionCookie) {
    throw new Error("expected startSession to set the session cookie");
  }
  return sessionCookie.split(";")[0];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/session", () => {
  it('answers user (with role "customer"), locale and expired:false for an active session', async () => {
    const account = await createAccount({ username: "sessionrole1", password: "correct-horse-1" });
    const started = makeEvent();
    await startSession(started, account);
    const cookie = extractSessionCookieHeader(started);

    const result = await getSession(makeEvent(cookie));

    expect(result).toEqual({
      user: { id: account.id, username: "sessionrole1", role: "customer" },
      locale: "en_US",
      expired: false,
    });
  });

  it('answers user.role: "admin" for an admin account (design.md C6)', async () => {
    const account = await createAccount({ username: "sessionrole2", password: "correct-horse-1" });
    db.update(accounts).set({ role: "admin" }).where(eq(accounts.id, account.id)).run();
    const started = makeEvent();
    await startSession(started, account);
    const cookie = extractSessionCookieHeader(started);

    const result = await getSession(makeEvent(cookie));

    expect(result).toMatchObject({ user: { role: "admin" } });
  });

  it("answers user: null and expired: false when there is no session", async () => {
    const result = await getSession(makeEvent());

    expect(result).toEqual({ user: null, locale: "en_US", expired: false });
  });

  it("answers user: null and expired: true when the session has timed out, and never throws", async () => {
    const account = await createAccount({ username: "sessionrole3", password: "correct-horse-1" });
    const started = makeEvent();
    await startSession(started, account);
    const cookie = extractSessionCookieHeader(started);

    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    const result = await getSession(makeEvent(cookie));

    expect(result).toEqual({ user: null, locale: "en_US", expired: true });
  });

  it("[SWHR3-C-0028] a session cookie from sign-in is HttpOnly/SameSite=Lax, and carries the admin role to GET /api/session", async () => {
    const account = await createAccount({ username: "sessionrole4", password: "correct-horse-1" });
    db.update(accounts).set({ role: "admin" }).where(eq(accounts.id, account.id)).run();

    const signInEvent = new H3Event(
      new Request("http://localhost/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ j_username: "sessionrole4", j_password: "correct-horse-1" }),
      }),
    );
    await signIn(signInEvent);
    const setCookies = signInEvent.res.headers.getSetCookie();
    const sessionCookie = setCookies.find((c) => c.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.toLowerCase()).toContain("httponly");
    expect(sessionCookie?.toLowerCase()).toContain("samesite=lax");

    const result = await getSession(makeEvent(sessionCookie?.split(";")[0]));

    expect(result).toMatchObject({ user: { username: "sessionrole4", role: "admin" } });
  });
});
