import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { AUTH_CONFIG } from "../../../lib/auth-config";
import { readSession, startSession } from "../../../lib/session";
import signOut from "./signout.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/hello.test.ts. POST
 * /api/auth/signout clears the session and answers 204 (design.md C9).
 */
function makeEvent(cookieHeader?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/auth/signout", {
      method: "POST",
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

describe("POST /api/auth/signout", () => {
  it("answers 204 with no body", async () => {
    const result = await signOut(makeEvent());

    expect(result.status).toBe(204);
    expect(result.body).toBeNull();
  });

  it("clears an active session so the next request reads as none", async () => {
    const started = makeEvent();
    await startSession(started, { id: 7, username: "jgarrett" });
    const cookie = extractSessionCookieHeader(started);

    await signOut(makeEvent(cookie));

    expect(await readSession(makeEvent())).toEqual({ status: "none" });
  });
});
