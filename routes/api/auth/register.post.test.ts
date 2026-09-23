import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { AUTH_CONFIG } from "../../../lib/auth-config";
import { readSession } from "../../../lib/session";
import register from "./register.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/auth/signin.post.test.ts. Covers
 * the 201 + session cookie + status code, 409 duplicate, and 422 for a
 * mismatched confirmation, a short password and a bad user name
 * (design.md C12).
 */
function makeEvent(body: unknown, cookieHeader?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    j_username: "newcustomer1",
    j_password: "correct-horse-1",
    j_password_confirm: "correct-horse-1",
    ...overrides,
  };
}

describe("POST /api/auth/register", () => {
  it("answers 201 with the user, starts a session, on a valid registration (AC-3, AC-4)", async () => {
    const event = makeEvent(validBody());

    const result = await register(event);

    expect(event.res.status).toBe(201);
    expect(result).toEqual({ user: { id: expect.any(Number), username: "newcustomer1" } });
    const sessionCookie = event.res.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${AUTH_CONFIG.sessionCookieName}=`));
    expect(sessionCookie).toBeDefined();
    const readEvent = makeEvent({}, sessionCookie?.split(";")[0]);
    await expect(readSession(readEvent)).resolves.toMatchObject({
      status: "active",
      user: { username: "newcustomer1" },
    });
  });

  it("answers 409 DUPLICATE_ACCOUNT for a taken user name (AC-3)", async () => {
    await register(makeEvent(validBody({ j_username: "takenname1" })));

    await expect(
      register(makeEvent(validBody({ j_username: "takenname1" }))),
    ).rejects.toMatchObject({
      status: 409,
      data: { code: "DUPLICATE_ACCOUNT" },
    });
  });

  it("answers 422 with fieldErrors.j_password_confirm when the passwords differ (AC-4)", async () => {
    const event = makeEvent(
      validBody({ j_password: "correct-horse-1", j_password_confirm: "different-horse-1" }),
    );

    await expect(register(event)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { j_password_confirm: expect.any(String) } },
    });
  });

  it("answers 422 with fieldErrors.j_password for a too-short password", async () => {
    const event = makeEvent(validBody({ j_password: "short1", j_password_confirm: "short1" }));

    await expect(register(event)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { j_password: expect.any(String) } },
    });
  });

  it("answers 422 with fieldErrors.j_username for a user name breaking the rules", async () => {
    const event = makeEvent(validBody({ j_username: "a" }));

    await expect(register(event)).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { j_username: expect.any(String) } },
    });
  });
});
