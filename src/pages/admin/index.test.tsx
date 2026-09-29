import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminHome from "./index";

/**
 * UI / PAGE TEST
 *
 * Mocks global fetch for both GET /api/session (RequireAdmin, AdminShell)
 * and GET /api/admin/orders (this page's counts). Covers design.md D9's
 * /admin home and mockup-admin-home.html's four counts.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function order(id: number, status: string) {
  return {
    id,
    customerName: `Customer ${id}`,
    orderDate: "2026-01-01T00:00:00.000Z",
    totalCents: 100000,
    status,
  };
}

function mockFetch(orders: Record<string, unknown[]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/session") {
        return Promise.resolve(
          jsonResponse({
            user: { id: 1, username: "adminuser", role: "admin" },
            locale: "en_US",
            expired: false,
          }),
        );
      }
      if (url === "/api/admin/orders") {
        return Promise.resolve(jsonResponse({ orders }));
      }
      throw new Error(`unhandled fetch: ${url}`);
    }),
  );
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/signin" element={<p>Sign-in screen</p>} />
        <Route path="/admin/orders" element={<p>Orders screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminHome (/admin)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the PENDING/APPROVED/DENIED/COMPLETED counts from GET /api/admin/orders", async () => {
    mockFetch({
      PENDING: [order(1, "PENDING"), order(2, "PENDING")],
      APPROVED: [order(3, "APPROVED")],
      DENIED: [],
      COMPLETED: [order(4, "COMPLETED"), order(5, "COMPLETED"), order(6, "COMPLETED")],
    });

    renderAt("/admin");

    expect(await screen.findByText("2 orders are waiting for a decision")).toBeInTheDocument();
    const counts = screen.getAllByText(/^[0-9]+$/).map((el) => el.textContent);
    expect(counts).toEqual(["2", "1", "0", "3"]);
  });

  it("links to /admin/orders", async () => {
    mockFetch({ PENDING: [], APPROVED: [], DENIED: [], COMPLETED: [] });

    renderAt("/admin");
    await screen.findByText("0 orders are waiting for a decision");

    expect(screen.getByRole("link", { name: /Open order review/ })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
  });

  it("shows the shell's Orders nav and the ADMINISTRATOR label", async () => {
    mockFetch({ PENDING: [], APPROVED: [], DENIED: [], COMPLETED: [] });

    renderAt("/admin");

    expect(await screen.findByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
    expect(await screen.findByText("adminuser")).toBeInTheDocument();
  });

  it("redirects a signed-out visitor to /admin/signin instead of rendering counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/session") {
          return Promise.resolve(jsonResponse({ user: null, locale: "en_US", expired: false }));
        }
        // The page's own load effect races RequireAdmin's session check —
        // the server 401s a signed-out visitor's admin request the same
        // way (design.md D4), and the page must swallow it, not throw.
        return Promise.resolve(jsonResponse({ message: "Authentication required" }, 401));
      }),
    );

    renderAt("/admin");

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
  });
});
