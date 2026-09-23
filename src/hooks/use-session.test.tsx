import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSession } from "./use-session";

/**
 * HOOK TEST
 *
 * Mocks global fetch (same pattern as src/utils/api.test.ts) and wraps the
 * hook in a MemoryRouter since it reads useLocation. Covers GET /api/session
 * on mount (design.md C9) and a refetch when the location changes.
 */
function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

describe("useSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts loading, then resolves to the signed-in user", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              user: { id: 1, username: "jgarrett" },
              locale: "en_US",
              expired: false,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toEqual({
      loading: false,
      user: { id: 1, username: "jgarrett" },
      locale: "en_US",
      expired: false,
    });
  });

  it("resolves to a null user and expired:true when the session has timed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: null, locale: "en_US", expired: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.expired).toBe(true);
  });

  it("resolves to a signed-out state when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it("calls GET /api/session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: null, locale: "en_US", expired: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/session", expect.anything()));
  });
});
