import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequireAdmin } from "./require-admin";

/**
 * UI / COMPONENT TEST
 *
 * Mocks global fetch to drive useSession's states (loading, signed-out,
 * signed-in customer, signed-in admin) and renders inside a MemoryRouter +
 * Routes so useLocation and <Navigate> have a real router context (same
 * pattern as src/components/auth/require-auth.test.tsx). Covers design.md
 * D9's client-side admin gate.
 */
function sessionResponse(
  user: { id: number; username: string; role: "customer" | "admin" } | null,
) {
  return new Response(JSON.stringify({ user, locale: "en_US", expired: false }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin/orders"
          element={
            <RequireAdmin>
              <p>Orders content</p>
            </RequireAdmin>
          }
        />
        <Route path="/admin/signin" element={<p>Sign-in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAdmin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the loading fallback while the session check is pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    renderAt("/admin/orders");

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("Orders content")).not.toBeInTheDocument();
  });

  it("redirects a signed-out visitor to /admin/signin with the path in redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse(null)));

    renderAt("/admin/orders");

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
  });

  it("redirects a signed-in non-admin to /admin/signin", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(sessionResponse({ id: 5, username: "supplier_ops", role: "customer" })),
    );

    renderAt("/admin/orders");

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
    expect(screen.queryByText("Orders content")).not.toBeInTheDocument();
  });

  it("renders the gated content for a signed-in admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sessionResponse({ id: 1, username: "adminuser", role: "admin" })),
    );

    renderAt("/admin/orders");

    expect(await screen.findByText("Orders content")).toBeInTheDocument();
  });

  it("carries the visited path and query into the redirect parameter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse(null)));

    function SignInProbe() {
      const location = useLocation();
      return <p>signin-search:{location.search}</p>;
    }

    render(
      <MemoryRouter initialEntries={["/admin/orders?tab=approved"]}>
        <Routes>
          <Route
            path="/admin/orders"
            element={
              <RequireAdmin>
                <p>Orders content</p>
              </RequireAdmin>
            }
          />
          <Route path="/admin/signin" element={<SignInProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("signin-search:?redirect=%2Fadmin%2Forders%3Ftab%3Dapproved"),
    ).toBeInTheDocument();
  });
});
