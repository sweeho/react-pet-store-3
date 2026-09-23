import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_CONFIG } from "../../lib/auth-config";
import { startSession } from "../../lib/session";
import getSession from "./session.get";

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
  it("answers user, locale and expired:false for an active session", async () => {
    const started = makeEvent();
    await startSession(started, { id: 7, username: "jgarrett" });
    const cookie = extractSessionCookieHeader(started);

    const result = await getSession(makeEvent(cookie));

    expect(result).toEqual({
      user: { id: 7, username: "jgarrett" },
      locale: "en_US",
      expired: false,
    });
  });

  it("answers user: null and expired: false when there is no session", async () => {
    const result = await getSession(makeEvent());

    expect(result).toEqual({ user: null, locale: "en_US", expired: false });
  });

  it("answers user: null and expired: true when the session has timed out, and never throws", async () => {
    const started = makeEvent();
    await startSession(started, { id: 7, username: "jgarrett" });
    const cookie = extractSessionCookieHeader(started);

    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    const result = await getSession(makeEvent(cookie));

    expect(result).toEqual({ user: null, locale: "en_US", expired: true });
  });
});
