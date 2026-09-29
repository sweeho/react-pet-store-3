import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequireSupplier } from "./require-supplier";

/**
 * UI / INTEGRATION TEST. design.md D1: the supplier guard. Signed out goes to
 * /supplier/signin?redirect=..; a signed-in account without the supplier
 * role sees "Access denied" and never the children.
 */
type Role = "customer" | "admin" | "supplier";

function sessionResponse(role: Role | null) {
  return new Response(
    JSON.stringify({
      user: role ? { id: 1, username: "someone", role } : null,
      locale: "en_US",
      expired: false,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function stubSession(role: Role | null) {
  const fetchMock = vi
    .fn()
    .mockImplementation((path: string) =>
      Promise.resolve(
        path === "/api/session"
          ? sessionResponse(role)
          : new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/supplier"
          element={
            <RequireSupplier>
              <table aria-label="Inventory" />
            </RequireSupplier>
          }
        />
        <Route path="/supplier/signin" element={<LocationEcho />} />
      </Routes>
    </MemoryRouter>,
  );
}

function LocationEcho() {
  const location = useLocation();
  return <p>{`Sign-in at ${location.pathname}${location.search}`}</p>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RequireSupplier", () => {
  it("renders the loading fallback while the session check is pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    renderAt("/supplier");

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Inventory" })).toBeNull();
  });

  it("[SWHR3-C-0187] no session redirects to /supplier/signin?redirect=/supplier", async () => {
    stubSession(null);

    renderAt("/supplier");

    expect(
      await screen.findByText("Sign-in at /supplier/signin?redirect=%2Fsupplier"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Inventory" })).toBeNull();
  });

  it.each<Role>(["customer", "admin"])(
    "[SWHR3-C-0187] a %s session sees Access denied, with a way to sign in as another user, and no inventory",
    async (role) => {
      stubSession(role);

      renderAt("/supplier");

      expect(await screen.findByRole("heading", { name: "Access denied" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign in as a different user" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/restricted to accounts with the supplier administrator role/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ask them to add the supplier administrator role/),
      ).toBeInTheDocument();
      expect(screen.queryByRole("table", { name: "Inventory" })).toBeNull();
    },
  );

  it("a supplier session reaches the children", async () => {
    stubSession("supplier");

    renderAt("/supplier");

    expect(await screen.findByRole("table", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access denied" })).toBeNull();
  });

  it("Sign in as a different user signs out and goes to /supplier/signin", async () => {
    const fetchMock = stubSession("customer");
    renderAt("/supplier");

    await userEvent.click(
      await screen.findByRole("button", { name: "Sign in as a different user" }),
    );

    expect(await screen.findByText("Sign-in at /supplier/signin")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([p]) => p === "/api/auth/signout")).toBe(true);
  });
});
