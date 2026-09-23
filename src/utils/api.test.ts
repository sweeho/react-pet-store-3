import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "./api";

/**
 * UNIT TEST (client project)
 *
 * Mocks global fetch to cover apiFetch's success path and its conversion of
 * a non-2xx response into ApiError (design.md C4, AC-4).
 */
describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON with credentials same-origin and returns the parsed body on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1, username: "jgarrett" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ user: { id: number; username: string } }>("/api/auth/signin", {
      method: "POST",
      body: { j_username: "jgarrett", j_password: "secret123" },
    });

    expect(result).toEqual({ user: { id: 1, username: "jgarrett" } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/signin");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBe(JSON.stringify({ j_username: "jgarrett", j_password: "secret123" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("throws an ApiError carrying status, message, code and fieldErrors for a JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Validation failed",
            data: {
              code: "VALIDATION_FAILED",
              fieldErrors: { j_username: "User name is required" },
            },
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      apiFetch("/api/auth/register", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      status: 422,
      message: "Validation failed",
      code: "VALIDATION_FAILED",
      fieldErrors: { j_username: "User name is required" },
    });
  });

  it("throws an ApiError with a fallback message for a non-JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Internal Server Error</html>", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    let caught: unknown;
    try {
      await apiFetch("/api/customers/me");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(500);
    expect((caught as ApiError).message).toBeTruthy();
    expect((caught as ApiError).code).toBeUndefined();
    expect((caught as ApiError).fieldErrors).toBeUndefined();
  });
});
