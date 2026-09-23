import { H3Event } from "nitro/h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_CONFIG } from "./auth-config";
import { endSession, readSession, requireSessionUser, startSession } from "./session";

/**
 * UNIT TEST (server project)
 *
 * Sessions are stateless sealed cookies (design.md D2), so each simulated
 * "request" is a fresh H3Event; the cookie a prior call sealed into
 * event.res is read back out and attached as the next event's incoming
 * Cookie header, the same way a browser round-trips it. vi.setSystemTime
 * drives the idle-timeout math (AC-6).
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
    throw new Error("expected startSession/readSession to set the session cookie");
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

describe("startSession + readSession", () => {
  it("creates a session carrying the account, and defaults the locale to en_US (AC-1, AC-3)", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);

    const result = await readSession(makeEvent(cookie));

    expect(result).toEqual({
      status: "active",
      user: USER,
      locale: "en_US",
    });
  });

  it("reads as none when there is no cookie at all", async () => {
    expect(await readSession(makeEvent())).toEqual({ status: "none" });
  });

  it("reads as expired when the cookie is present but cannot be unsealed", async () => {
    const result = await readSession(
      makeEvent(`${AUTH_CONFIG.sessionCookieName}=not-a-real-sealed-value`),
    );

    expect(result).toEqual({ status: "expired" });
  });

  it("stays active and restarts its idle window when read 29 minutes after the last activity (AC-6)", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    let cookie = extractSessionCookieHeader(started);

    vi.setSystemTime(new Date("2026-01-01T12:29:00.000Z")); // +29 minutes
    const firstRead = makeEvent(cookie);
    expect(await readSession(firstRead)).toEqual({ status: "active", user: USER, locale: "en_US" });
    cookie = extractSessionCookieHeader(firstRead); // re-sealed with a fresh lastSeen

    vi.setSystemTime(new Date("2026-01-01T12:58:00.000Z")); // +29 more minutes since the read above
    const secondRead = makeEvent(cookie);
    expect(await readSession(secondRead)).toEqual({
      status: "active",
      user: USER,
      locale: "en_US",
    });
  });

  it("reads as expired 31 minutes after the last activity (AC-6)", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);

    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    expect(await readSession(makeEvent(cookie))).toEqual({ status: "expired" });
  });
});

describe("endSession", () => {
  it("clears the session so the next request (with the cookie dropped, as a browser would) reads as none", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);
    expect(await readSession(makeEvent(cookie))).toMatchObject({ status: "active" });

    await endSession(started);

    expect(await readSession(makeEvent())).toEqual({ status: "none" });
  });
});

describe("requireSessionUser", () => {
  it("returns the user for an active session", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);

    expect(await requireSessionUser(makeEvent(cookie))).toEqual(USER);
  });

  it("throws a 401 'Authentication required' when there is no session", async () => {
    await expect(requireSessionUser(makeEvent())).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("throws a 401 'Session timed out' when the session has expired", async () => {
    const started = makeEvent();
    await startSession(started, USER);
    const cookie = extractSessionCookieHeader(started);

    vi.setSystemTime(new Date("2026-01-01T12:31:00.000Z")); // +31 minutes

    await expect(requireSessionUser(makeEvent(cookie))).rejects.toMatchObject({
      status: 401,
      message: "Session timed out",
    });
  });
});
