import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierSignIn from "./signin";

/**
 * UI / PAGE TEST. mockup-supplier-sign-in.html: "Pet Store Supplier", "Sign
 * in to manage inventory.", Username, Password, Sign in, and the issuing
 * note. After signing in it re-reads GET /api/session for the role (the POST
 * response carries none); a non-supplier sees the access-denied content.
 */
type Role = "customer" | "admin" | "supplier";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function session(role: Role | null) {
  return json({
    user: role ? { id: 1, username: "d.okafor", role } : null,
    locale: "en_US",
    expired: false,
  });
}

/** Signed out until sign-in succeeds, then a session with `roleAfterSignIn`. */
function stubFlow(roleAfterSignIn: Role, signInStatus = 200) {
  let signedIn = false;
  const fetchMock = vi.fn().mockImplementation((path: string) => {
    if (path === "/api/auth/signin") {
      signedIn = signInStatus === 200;
      return Promise.resolve(
        signInStatus === 200
          ? json({ user: { id: 1, username: "d.okafor" } })
          : json({ message: "no" }, signInStatus),
      );
    }
    if (path === "/api/auth/signout") {
      signedIn = false;
      return Promise.resolve(json({}));
    }
    return Promise.resolve(session(signedIn ? roleAfterSignIn : null));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/supplier/signin" element={<SupplierSignIn />} />
        <Route path="/supplier" element={<p>Supplier home screen</p>} />
        <Route path="/supplier/other" element={<p>Supplier other screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function signIn() {
  await userEvent.type(await screen.findByLabelText("Username"), "d.okafor");
  await userEvent.type(screen.getByLabelText("Password"), "supplier2026");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SupplierSignIn (/supplier/signin)", () => {
  it("renders the mockup's sign-in form when signed out", async () => {
    stubFlow("supplier");

    renderAt("/supplier/signin");

    expect(await screen.findByText("Pet Store Supplier")).toBeInTheDocument();
    expect(screen.getByText("Sign in to manage inventory.")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByText("Supplier accounts are issued by the store administrator."),
    ).toBeInTheDocument();
  });

  it("signing in as a supplier lands on /supplier", async () => {
    stubFlow("supplier");
    renderAt("/supplier/signin");

    await signIn();

    expect(await screen.findByText("Supplier home screen")).toBeInTheDocument();
  });

  it("returns a supplier to the redirect target", async () => {
    stubFlow("supplier");
    renderAt("/supplier/signin?redirect=%2Fsupplier%2Fother");

    await signIn();

    expect(await screen.findByText("Supplier other screen")).toBeInTheDocument();
  });

  it.each<Role>(["customer", "admin"])(
    "a %s who signs in sees Access denied and does not reach the portal",
    async (role) => {
      stubFlow(role);
      renderAt("/supplier/signin");

      await signIn();

      expect(await screen.findByRole("heading", { name: "Access denied" })).toBeInTheDocument();
      expect(screen.queryByText("Supplier home screen")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Sign in as a different user" }),
      ).toBeInTheDocument();
    },
  );

  it("shows a sign-in failure alert and clears the password", async () => {
    stubFlow("supplier", 401);
    renderAt("/supplier/signin");

    await signIn();

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-in failed");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("does not follow an off-site redirect", async () => {
    stubFlow("supplier");
    renderAt("/supplier/signin?redirect=%2F%2Fevil.example");

    await signIn();

    expect(await screen.findByText("Supplier home screen")).toBeInTheDocument();
  });

  it("an already signed-in supplier is sent straight to the target", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(session("supplier"))),
    );

    renderAt("/supplier/signin");

    expect(await screen.findByText("Supplier home screen")).toBeInTheDocument();
  });
});
