import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAccount } from "../../lib/accounts";
import { AUTH_CONFIG } from "../../lib/auth-config";
import signIn from "./auth/signin.post";
import getCustomerMe from "./customers/me.get";

/**
 * INTEGRATION TEST (server project)
 *
 * Signs in through the real POST /api/auth/signin handler, then calls the
 * real GET /api/customers/me handler 31 idle minutes later, chaining two
 * route handlers the way a browser actually would — lib/session.test.ts
 * already unit-tests requireSessionUser's idle-timeout math in isolation;
 * this pins that the two real handlers agree on the same 401 once wired
 * together (design.md D2, SD9, D7).
 */
function makeEvent(pathname: string, init: RequestInit = {}): H3Event {
  return new H3Event(new Request(`http://localhost${pathname}`, init));
}

function extractSessionCookie(event: H3Event): string {
  const cookie = event.res.headers
    .getSetCookie()
    .find((entry) => entry.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
  if (!cookie) {
    throw new Error("expected signIn to set the session cookie");
  }
  return cookie.split(";")[0];
}

describe("GET /api/customers/me idle-timeout, via the real signin -> customers/me handlers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers 401 'Session timed out' once 30 idle minutes have passed since sign-in", async () => {
    await createAccount({ username: "idletimeout1", password: "correct-horse-1" });

    const signInEvent = makeEvent("/api/auth/signin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ j_username: "idletimeout1", j_password: "correct-horse-1" }),
    });
    await signIn(signInEvent);
    const cookie = extractSessionCookie(signInEvent);

    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes, no activity in between

    const meEvent = makeEvent("/api/customers/me", { headers: { cookie } });
    await expect(getCustomerMe(meEvent)).rejects.toMatchObject({
      status: 401,
      message: "Session timed out",
    });
  });

  it("stays active and answers normally (not 401) inside the 30-minute window", async () => {
    await createAccount({ username: "idletimeout2", password: "correct-horse-1" });

    const signInEvent = makeEvent("/api/auth/signin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ j_username: "idletimeout2", j_password: "correct-horse-1" }),
    });
    await signIn(signInEvent);
    const cookie = extractSessionCookie(signInEvent);

    vi.setSystemTime(new Date("2026-01-01T12:29:00.000Z")); // +29 minutes

    const meEvent = makeEvent("/api/customers/me", { headers: { cookie } });
    // No customer profile exists yet for this account, so the active
    // session still reaches the 404 branch rather than a 401 — proof the
    // session itself, not the profile lookup, is what's under test here.
    await expect(getCustomerMe(meEvent)).rejects.toMatchObject({ status: 404 });
  });
});
