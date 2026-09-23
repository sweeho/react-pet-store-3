import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_CONFIG } from "../lib/auth-config";
import { startSession } from "../lib/session";
import authMiddleware from "./auth";

/**
 * INTEGRATION TEST (server project)
 *
 * Same real-H3Event pattern as lib/session.test.ts: a prior call's sealed
 * cookie is read back as the next event's incoming Cookie header. Covers
 * the none/expired/active cases on both a protected and a non-protected
 * path (design.md D7, AC-6, AC-7).
 */
function makeEvent(pathname: string, cookieHeader?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost${pathname}`, {
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

const USER = { id: 7, username: "jgarrett" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("auth middleware", () => {
  it("sets event.context.user/locale for an active session, on a protected path", async () => {
    const started = makeEvent("/api/customers");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    const event = makeEvent("/api/customers", cookie);

    await authMiddleware(event);

    expect(event.context.user).toEqual(USER);
    expect(event.context.locale).toBe("en_US");
  });

  it("throws 401 'Authentication required' on a protected path with no session", async () => {
    const event = makeEvent("/api/customers");

    await expect(authMiddleware(event)).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("throws 401 'Session timed out' on a protected path with an expired session", async () => {
    const started = makeEvent("/api/customers/me");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    await expect(authMiddleware(makeEvent("/api/customers/me", cookie))).rejects.toMatchObject({
      status: 401,
      message: "Session timed out",
    });
  });

  it("does not throw on a non-protected path with no session, and leaves context.user undefined", async () => {
    const event = makeEvent("/api/hello");

    await expect(authMiddleware(event)).resolves.toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it("still attaches context.user on a non-protected path when a session is active", async () => {
    const started = makeEvent("/api/hello");
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    const event = makeEvent("/api/hello", cookie);

    await authMiddleware(event);

    expect(event.context.user).toEqual(USER);
  });
});
