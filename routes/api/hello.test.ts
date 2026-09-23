import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { AUTH_CONFIG } from "../../lib/auth-config";
import { startSession } from "../../lib/session";
import authMiddleware from "../../middleware/auth";
import hello from "./hello";

/**
 * INTEGRATION TEST
 *
 * Exercises the real auth middleware + /api/hello route the way Nitro
 * actually runs them (real H3Event, no HTTP server). /api/hello is not a
 * protected path, so the middleware never throws here — it just may or may
 * not populate event.context.user (design.md AC-9).
 */
describe("auth middleware + /api/hello route", () => {
  it('greets "guest" when there is no session', async () => {
    const event = new H3Event(new Request("http://localhost/api/hello"));

    await authMiddleware(event);
    const result = await hello(event);

    expect(result).toEqual({ success: true, message: "Hello guest" });
  });

  it("greets the signed-in user by user name when there is an active session", async () => {
    const started = new H3Event(new Request("http://localhost/api/hello"));
    await startSession(started, { id: 7, username: "jgarrett" });
    const sessionCookie = started.res.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
    if (!sessionCookie) {
      throw new Error("expected startSession to set the session cookie");
    }

    const event = new H3Event(
      new Request("http://localhost/api/hello", {
        headers: { cookie: sessionCookie.split(";")[0] },
      }),
    );
    await authMiddleware(event);
    const result = await hello(event);

    expect(result).toEqual({ success: true, message: "Hello jgarrett" });
  });

  it('answers "guest" even without the middleware running first (no throw)', () => {
    const event = new H3Event(new Request("http://localhost/api/hello"));

    expect(hello(event)).toEqual({ success: true, message: "Hello guest" });
  });
});
