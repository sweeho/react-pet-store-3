import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupplierShell } from "./supplier-shell";

/**
 * UI / COMPONENT TEST. The supplier portal's own shell (mockup-inventory-
 * access-denied.html topbar): "Pet Store Supplier", the user's name, the
 * "Supplier administrator" label for a supplier, and Sign out.
 */
function session(role: "customer" | "admin" | "supplier" | null) {
  return new Response(
    JSON.stringify({
      user: role ? { id: 1, username: "ray.mendoza", role } : null,
      locale: "en_US",
      expired: false,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/supplier"]}>
      <Routes>
        <Route
          path="/supplier"
          element={
            <SupplierShell>
              <p>Portal content</p>
            </SupplierShell>
          }
        />
        <Route path="/supplier/signin" element={<p>Supplier sign-in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SupplierShell", () => {
  it("shows the brand, the user's name, the role label, Sign out and the children", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(session("supplier"))),
    );

    renderShell();

    expect(screen.getByText("Pet Store Supplier")).toBeInTheDocument();
    expect(await screen.findByText("ray.mendoza")).toBeInTheDocument();
    expect(screen.getByText("Supplier administrator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });

  it("does not label a non-supplier as a supplier administrator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(session("customer"))),
    );

    renderShell();

    expect(await screen.findByText("ray.mendoza")).toBeInTheDocument();
    expect(screen.queryByText("Supplier administrator")).toBeNull();
  });

  it("Sign out posts to /api/auth/signout and goes to the supplier sign-in", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((path: string) =>
        Promise.resolve(
          path === "/api/session"
            ? session("supplier")
            : new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderShell();

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Supplier sign-in screen")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([p]) => p === "/api/auth/signout")).toBe(true);
  });
});
