import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminOrders from "./orders";

/**
 * UI / PAGE TEST
 *
 * Mocks global fetch for GET /api/session (RequireAdmin, AdminShell), GET
 * /api/admin/orders (this page's load/reload, one response per call so a
 * reload can answer differently) and POST /api/admin/orders/status
 * (CommitDecisionsDialog, SWHR3-T-0043). Covers design.md D10 (four tabs,
 * only Pending editable) and D11 (commit clears staging and reloads on
 * success; a failure keeps every staged decision).
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SESSION_ADMIN = {
  user: { id: 1, username: "adminuser", role: "admin" as const },
  locale: "en_US",
  expired: false,
};

function order(id: number, status: string) {
  return {
    id,
    customerName: `Customer ${id}`,
    orderDate: "2026-01-01T00:00:00.000Z",
    totalCents: 100000,
    status,
  };
}

interface FetchSetup {
  ordersResponses: Array<Record<string, unknown[]>>;
  commitResponse?: () => Response;
}

function mockFetch({ ordersResponses, commitResponse }: FetchSetup) {
  let ordersCall = 0;
  const fn = vi.fn((url: string) => {
    if (url === "/api/session") {
      return Promise.resolve(jsonResponse(SESSION_ADMIN));
    }
    if (url === "/api/admin/orders") {
      const index = Math.min(ordersCall, ordersResponses.length - 1);
      ordersCall += 1;
      return Promise.resolve(jsonResponse({ orders: ordersResponses[index] }));
    }
    if (url === "/api/admin/orders/status") {
      if (commitResponse) {
        return Promise.resolve(commitResponse());
      }
      throw new Error("commitResponse not configured for this test");
    }
    throw new Error(`unhandled fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function renderAt(initialPath = "/admin/orders") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/signin" element={<p>Sign-in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function rowFor(orderId: number): HTMLElement {
  const cell = screen.getByRole("cell", { name: String(orderId) });
  const row = cell.closest("tr");
  if (!row) {
    throw new Error(`no <tr> ancestor for order ${orderId}`);
  }
  return row;
}

describe("AdminOrders (/admin/orders)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[SWHR3-C-0001] shows four tabs labelled Pending/Approved/Denied/Completed, each with its count", async () => {
    mockFetch({
      ordersResponses: [
        {
          PENDING: [order(1001, "PENDING")],
          APPROVED: [order(1002, "APPROVED")],
          DENIED: [order(1003, "DENIED")],
          COMPLETED: [order(1004, "COMPLETED"), order(1005, "COMPLETED")],
        },
      ],
    });

    renderAt();

    const tablist = await screen.findByRole("tablist", { name: "Order status" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Pending1",
      "Approved1",
      "Denied1",
      "Completed2",
    ]);
  });

  it("[SWHR3-C-0025] the Approved tab is read-only: no checkbox, select or bulk controls", async () => {
    const user = userEvent.setup();
    mockFetch({
      ordersResponses: [
        {
          PENDING: [order(1001, "PENDING")],
          APPROVED: [order(2001, "APPROVED")],
          DENIED: [],
          COMPLETED: [],
        },
      ],
    });

    renderAt();
    await screen.findByRole("tablist");

    await user.click(screen.getByRole("tab", { name: /Approved/ }));

    expect(await screen.findByText("2001")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve selected" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deny selected" })).not.toBeInTheDocument();
    expect(screen.getByText(/Read-only/)).toBeInTheDocument();
  });

  it("stages an approval from the Pending tab and shows the commit bar", async () => {
    const user = userEvent.setup();
    mockFetch({
      ordersResponses: [
        { PENDING: [order(1001, "PENDING")], APPROVED: [], DENIED: [], COMPLETED: [] },
      ],
    });

    renderAt();
    await screen.findByText("1001");

    await user.click(within(rowFor(1001)).getByRole("checkbox", { name: /select order 1001/i }));
    await user.click(screen.getByRole("button", { name: "Approve selected" }));

    expect(await screen.findByText("1 decision staged, not yet sent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commit 1 decision" })).toBeInTheDocument();
  });

  it("a successful commit clears staging and reloads all four groups (AC-5)", async () => {
    const user = userEvent.setup();
    mockFetch({
      ordersResponses: [
        { PENDING: [order(1001, "PENDING")], APPROVED: [], DENIED: [], COMPLETED: [] },
        { PENDING: [], APPROVED: [order(1001, "APPROVED")], DENIED: [], COMPLETED: [] },
      ],
      commitResponse: () => jsonResponse({ type: "UPDATEORDERS", status: "SUCCESS", updated: 1 }),
    });

    renderAt();
    await screen.findByText("1001");

    await user.click(within(rowFor(1001)).getByRole("checkbox", { name: /select order 1001/i }));
    await user.click(screen.getByRole("button", { name: "Approve selected" }));
    await user.click(await screen.findByRole("button", { name: "Commit 1 decision" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Commit 1 decision" }));

    expect(await within(dialog).findByText(/1 decision committed/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Done" }));

    expect(screen.queryByText(/decision staged, not yet sent/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Approved/ }));
    expect(await screen.findByText("1001")).toBeInTheDocument();
  });

  it("a failed commit keeps every staged decision (AC-5)", async () => {
    const user = userEvent.setup();
    mockFetch({
      ordersResponses: [
        { PENDING: [order(1001, "PENDING")], APPROVED: [], DENIED: [], COMPLETED: [] },
      ],
      commitResponse: () =>
        jsonResponse(
          {
            message: "Order 1001 is APPROVED and cannot be transitioned",
            data: { code: "INVALID_TRANSITION" },
          },
          409,
        ),
    });

    renderAt();
    await screen.findByText("1001");

    await user.click(within(rowFor(1001)).getByRole("checkbox", { name: /select order 1001/i }));
    await user.click(screen.getByRole("button", { name: "Approve selected" }));
    await user.click(await screen.findByRole("button", { name: "Commit 1 decision" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Commit 1 decision" }));

    expect(
      await within(dialog).findByText("Order 1001 is APPROVED and cannot be transitioned"),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(within(rowFor(1001)).getByRole("combobox")).toHaveValue("APPROVED");
    expect(within(rowFor(1001)).getByText("Staged")).toBeInTheDocument();
    expect(screen.getByText("1 decision staged, not yet sent")).toBeInTheDocument();
  });

  it("Refresh reloads orders from the server", async () => {
    const user = userEvent.setup();
    mockFetch({
      ordersResponses: [
        { PENDING: [order(1001, "PENDING")], APPROVED: [], DENIED: [], COMPLETED: [] },
        {
          PENDING: [order(1001, "PENDING"), order(1006, "PENDING")],
          APPROVED: [],
          DENIED: [],
          COMPLETED: [],
        },
      ],
    });

    renderAt();
    await screen.findByText("1001");
    expect(screen.queryByText("1006")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("1006")).toBeInTheDocument();
  });

  it("redirects a signed-out visitor to /admin/signin instead of rendering the queue", async () => {
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

    renderAt();

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
