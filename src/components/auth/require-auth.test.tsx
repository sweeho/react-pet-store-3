import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequireAuth } from "./require-auth";

/**
 * UI / COMPONENT TEST
 *
 * Mocks global fetch to drive useSession's states (loading, signed-out,
 * signed-in) and renders inside a MemoryRouter + Routes so useLocation and
 * <Navigate> have a real router context (same pattern as
 * sign-out-button.test.tsx). Covers design.md D7's client-side guard.
 */
function sessionResponse(user: { id: number; username: string } | null, expired = false) {
  return new Response(JSON.stringify({ user, locale: "en_US", expired }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/users/profile"
          element={
            <RequireAuth>
              <p>Profile content</p>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <p>Home content</p>
            </RequireAuth>
          }
        />
        <Route path="/signin" element={<p>Sign in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Suspense-matching fallback while the session check is loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    renderAt("/users/profile");

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("Profile content")).not.toBeInTheDocument();
  });

  it("redirects a signed-out visitor away from a protected path, with redirect set to it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse(null)));

    renderAt("/users/profile");

    expect(await screen.findByText("Sign in screen")).toBeInTheDocument();
  });

  it("renders the protected page for a signed-in visitor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sessionResponse({ id: 1, username: "jgarrett" })),
    );

    renderAt("/users/profile");

    expect(await screen.findByText("Profile content")).toBeInTheDocument();
  });

  it("renders a non-protected path for a signed-out visitor, no redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse(null)));

    renderAt("/");

    expect(await screen.findByText("Home content")).toBeInTheDocument();
  });

  it("carries the visited path and query into the redirect query parameter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse(null)));

    function SignInProbe() {
      const location = useLocation();
      return <p>signin-search:{location.search}</p>;
    }

    render(
      <MemoryRouter initialEntries={["/users/profile?tab=cards"]}>
        <Routes>
          <Route
            path="/users/profile"
            element={
              <RequireAuth>
                <p>Profile content</p>
              </RequireAuth>
            }
          />
          <Route path="/signin" element={<SignInProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("signin-search:?redirect=%2Fusers%2Fprofile%3Ftab%3Dcards"),
    ).toBeInTheDocument();
  });
});
