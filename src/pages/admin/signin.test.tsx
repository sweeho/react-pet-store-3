import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminSignIn from "./signin";

/**
 * UI / PAGE TEST
 *
 * Mocks global fetch for GET /api/session (useSession), POST
 * /api/auth/signin and the follow-up GET /api/session this page makes
 * itself to learn the freshly-signed-in account's role (the POST response
 * carries none). Covers design.md D9's /admin/signin: the admin-vs-non-
 * admin split and the not-an-administrator state (SD15 — the mockup's
 * supplier-session note is omitted, no supplier role exists yet).
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/signin" element={<AdminSignIn />} />
        <Route path="/admin" element={<p>Admin home screen</p>} />
        <Route path="/admin/orders" element={<p>Admin orders screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminSignIn (/admin/signin)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the sign-in form when signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ user: null, locale: "en_US", expired: false })),
    );

    renderAt("/admin/signin");

    expect(
      await screen.findByRole("heading", { name: "Administrator sign-in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("User name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("signing in with an admin account redirects to the requested page (AC-1)", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/session") {
        return Promise.resolve(jsonResponse({ user: null, locale: "en_US", expired: false }));
      }
      if (url === "/api/auth/signin") {
        return Promise.resolve(jsonResponse({ user: { id: 1, username: "adminuser" } }));
      }
      throw new Error(`unhandled fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/admin/signin?redirect=%2Fadmin%2Forders");
    await screen.findByRole("heading", { name: "Administrator sign-in" });

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/auth/signin") {
        return Promise.resolve(jsonResponse({ user: { id: 1, username: "adminuser" } }));
      }
      if (url === "/api/session") {
        return Promise.resolve(
          jsonResponse({
            user: { id: 1, username: "adminuser", role: "admin" },
            locale: "en_US",
            expired: false,
          }),
        );
      }
      throw new Error(`unhandled fetch: ${url}`);
    });

    await user.type(screen.getByLabelText("User name"), "adminuser");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in as administrator" }));

    expect(await screen.findByText("Admin orders screen")).toBeInTheDocument();
  });

  it('[SWHR3-C-0027] signing in with a non-admin account shows "This account is not an administrator" with the user name, renders no order data, and keeps the form for a different user', async () => {
    const user = userEvent.setup();
    let sessionCallCount = 0;
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/session") {
        sessionCallCount += 1;
        if (sessionCallCount === 1) {
          return Promise.resolve(jsonResponse({ user: null, locale: "en_US", expired: false }));
        }
        return Promise.resolve(
          jsonResponse({
            user: { id: 7, username: "supplier_ops", role: "customer" },
            locale: "en_US",
            expired: false,
          }),
        );
      }
      if (url === "/api/auth/signin") {
        return Promise.resolve(jsonResponse({ user: { id: 7, username: "supplier_ops" } }));
      }
      throw new Error(`unhandled fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/admin/signin");
    await screen.findByRole("heading", { name: "Administrator sign-in" });

    await user.type(screen.getByLabelText("User name"), "supplier_ops");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in as administrator" }));

    expect(await screen.findByText("This account is not an administrator")).toBeInTheDocument();
    expect(screen.getByText("supplier_ops", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/PENDING|APPROVED|DENIED|COMPLETED/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("User name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in as administrator" })).toBeInTheDocument();
  });

  it("shows a sign-in-failed message on invalid credentials", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/session") {
        return Promise.resolve(jsonResponse({ user: null, locale: "en_US", expired: false }));
      }
      if (url === "/api/auth/signin") {
        return Promise.resolve(jsonResponse({ message: "Invalid user name or password" }, 401));
      }
      throw new Error(`unhandled fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/admin/signin");
    await screen.findByRole("heading", { name: "Administrator sign-in" });

    await user.type(screen.getByLabelText("User name"), "adminuser");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in as administrator" }));

    expect(await screen.findByText("Sign-in failed")).toBeInTheDocument();
  });

  it("already signed in as a non-admin (no submit needed) shows the notice immediately", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          user: { id: 7, username: "supplier_ops", role: "customer" },
          locale: "en_US",
          expired: false,
        }),
      ),
    );

    renderAt("/admin/signin");

    expect(await screen.findByText("This account is not an administrator")).toBeInTheDocument();
  });

  it("already signed in as an admin redirects straight to the requested page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          user: { id: 1, username: "adminuser", role: "admin" },
          locale: "en_US",
          expired: false,
        }),
      ),
    );

    renderAt("/admin/signin?redirect=%2Fadmin");

    expect(await screen.findByText("Admin home screen")).toBeInTheDocument();
  });
});
