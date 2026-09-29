import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "./admin-shell";

/**
 * UI / COMPONENT TEST
 *
 * Mocks global fetch for useSession (admin-shell.tsx reads the signed-in
 * user for the name/role label) and for the existing SignOutButton's
 * /api/auth/signout call. Covers design.md D9's shell.
 */
function sessionResponse(user: { id: number; username: string; role: "admin" }) {
  return new Response(JSON.stringify({ user, locale: "en_US", expired: false }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminShell>
              <p>Page content</p>
            </AdminShell>
          }
        />
        <Route path="/signin" element={<p>Sign-in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the brand, an Orders link to /admin/orders, and the wrapped content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sessionResponse({ id: 1, username: "adminuser", role: "admin" })),
    );

    renderShell();

    expect(screen.getByText("Pet Store")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/admin/orders");
    expect(await screen.findByText("Page content")).toBeInTheDocument();
  });

  it("shows the signed-in user's name with an ADMINISTRATOR label", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sessionResponse({ id: 1, username: "adminuser", role: "admin" })),
    );

    renderShell();

    expect(await screen.findByText("adminuser")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });

  it("signs out through /api/auth/signout and returns to /signin", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/session") {
        return Promise.resolve(sessionResponse({ id: 1, username: "adminuser", role: "admin" }));
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderShell();
    await screen.findByText("adminuser");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/signout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
