import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { createAccount } from "../../../lib/accounts";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { readSession } from "../../../lib/session";
import signIn from "./signin.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/hello.test.ts and
 * routes/api/auth/signout.post.test.ts. Covers the 200 + session cookie,
 * 401, 422, and the bp_signon set/delete cases (design.md C11, D6).
 */
function makeEvent(body: unknown, cookieHeader?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/auth/signin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function setCookiesOf(event: H3Event): string[] {
  return event.res.headers.getSetCookie();
}

function findCookie(event: H3Event, name: string): string | undefined {
  return setCookiesOf(event).find((cookie) => cookie.startsWith(`${name}=`));
}

async function seedAccount(username: string, password: string) {
  return createAccount({ username, password });
}

describe("POST /api/auth/signin", () => {
  it("answers 200 with the user and starts a session on valid credentials (AC-4)", async () => {
    await seedAccount("jgarrett1", "correct-horse-1");
    const event = makeEvent({ j_username: "jgarrett1", j_password: "correct-horse-1" });

    const result = await signIn(event);

    expect(result).toEqual({ user: { id: expect.any(Number), username: "jgarrett1" } });
    const sessionCookie = findCookie(event, AUTH_CONFIG.sessionCookieName);
    expect(sessionCookie).toBeDefined();
    const readEvent = makeEvent({}, sessionCookie?.split(";")[0]);
    await expect(readSession(readEvent)).resolves.toMatchObject({
      status: "active",
      user: { username: "jgarrett1" },
    });
  });

  it("answers 401 and sets no session cookie on a wrong password (AC-4)", async () => {
    await seedAccount("wrongpass1", "correct-horse-1");
    const event = makeEvent({ j_username: "wrongpass1", j_password: "totally-wrong-1" });

    await expect(signIn(event)).rejects.toMatchObject({ status: 401 });
    expect(findCookie(event, AUTH_CONFIG.sessionCookieName)).toBeUndefined();
  });

  it("answers 401 for an unknown user name", async () => {
    const event = makeEvent({ j_username: "does-not-exist-1", j_password: "whatever-12" });

    await expect(signIn(event)).rejects.toMatchObject({ status: 401 });
  });

  it("answers 422 through ValidationError when j_username or j_password is missing (AC-3)", async () => {
    const missingUsername = makeEvent({ j_password: "correct-horse-1" });
    await expect(signIn(missingUsername)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED" },
    });

    const missingPassword = makeEvent({ j_username: "someone1" });
    await expect(signIn(missingPassword)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED" },
    });
  });

  it("sets bp_signon with the user name when j_remember_username is true (AC-5)", async () => {
    await seedAccount("rememberme1", "correct-horse-1");
    const event = makeEvent({
      j_username: "rememberme1",
      j_password: "correct-horse-1",
      j_remember_username: true,
    });

    await signIn(event);

    const rememberCookie = findCookie(event, AUTH_CONFIG.rememberCookieName);
    expect(rememberCookie).toBeDefined();
    expect(rememberCookie).toContain("rememberme1");
    expect(rememberCookie).not.toMatch(/HttpOnly/i);
  });

  it("deletes bp_signon when j_remember_username is false or absent (AC-8)", async () => {
    await seedAccount("forgetme1", "correct-horse-1");

    const absent = makeEvent({ j_username: "forgetme1", j_password: "correct-horse-1" });
    await signIn(absent);
    const deletedOnAbsent = findCookie(absent, AUTH_CONFIG.rememberCookieName);
    expect(deletedOnAbsent).toBeDefined();
    expect(deletedOnAbsent).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);

    const explicitFalse = makeEvent({
      j_username: "forgetme1",
      j_password: "correct-horse-1",
      j_remember_username: false,
    });
    await signIn(explicitFalse);
    const deletedOnFalse = findCookie(explicitFalse, AUTH_CONFIG.rememberCookieName);
    expect(deletedOnFalse).toBeDefined();
    expect(deletedOnFalse).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });
});
