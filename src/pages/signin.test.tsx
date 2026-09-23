import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignIn from "./signin";

/**
 * UI / PAGE TEST
 *
 * Same MemoryRouter + fetch-mock pattern as sign-out-button.test.tsx.
 * Covers the fields and their names (AC-1), the bp_signon cookie prefill
 * (AC-2, AC-6), and the redirect handling on a successful sign-in (AC-9).
 */
function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/users/profile" element={<p>Profile screen</p>} />
        <Route path="/cart" element={<p>Cart screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function clearAllCookies() {
  for (const entry of document.cookie.split("; ")) {
    const name = entry.split("=")[0];
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

describe("SignIn page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearAllCookies();
  });

  it("renders the returning-customer fields with their form names, and a New customer panel (AC-1, AC-10)", () => {
    renderAt("/signin");

    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in to your account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("User name")).toHaveAttribute("name", "j_username");
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("name", "j_password");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(screen.getByRole("checkbox", { name: /Remember my user name/ })).toHaveAttribute(
      "name",
      "j_remember_username",
    );
    expect(screen.getByText(/Fills this field in for you next time/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "New customer" })).toBeInTheDocument();
  });

  it("pre-populates the user name field from the bp_signon cookie (AC-2, AC-6)", () => {
    document.cookie = "bp_signon=jgarrett";

    renderAt("/signin");

    expect(screen.getByLabelText("User name")).toHaveValue("jgarrett");
  });

  it("leaves the user name field empty when there is no bp_signon cookie", () => {
    renderAt("/signin");

    expect(screen.getByLabelText("User name")).toHaveValue("");
  });

  it("submits j_username/j_password/j_remember_username and navigates to a same-origin redirect on success (AC-3, AC-9)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1, username: "jgarrett" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderAt("/signin?redirect=%2Fcart");

    await user.type(screen.getByLabelText("User name"), "jgarrett");
    await user.type(screen.getByLabelText("Password"), "correct-horse-1");
    await user.click(screen.getByRole("checkbox", { name: /Remember my user name/ }));
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Cart screen")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/signin");
    expect(JSON.parse(init.body as string)).toEqual({
      j_username: "jgarrett",
      j_password: "correct-horse-1",
      j_remember_username: true,
    });
  });

  it("navigates to /users/profile when redirect is absent or not a single leading slash (AC-9)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 1, username: "jgarrett" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const user = userEvent.setup();
    renderAt("/signin?redirect=%2F%2Fevil.example.com");

    await user.type(screen.getByLabelText("User name"), "jgarrett");
    await user.type(screen.getByLabelText("Password"), "correct-horse-1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Profile screen")).toBeInTheDocument();
  });

  it("shows an inline error and does not navigate when sign-in fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid user name or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const user = userEvent.setup();
    renderAt("/signin");

    await user.type(screen.getByLabelText("User name"), "jgarrett");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid user name or password");
    expect(screen.queryByText("Profile screen")).not.toBeInTheDocument();
  });
});
