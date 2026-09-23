import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignIn from "./signin";

/**
 * UI / PAGE TEST
 *
 * Same MemoryRouter + fetch-mock pattern as sign-out-button.test.tsx.
 * Covers the fields and their names (AC-1), the bp_signon cookie prefill
 * (AC-2, AC-6), and the redirect handling on a successful sign-in (AC-9)
 * for the Returning customer panel, plus (SWHR3-T-0008) the New customer
 * panel's render, submit, duplicate-user-name and mismatch cases.
 *
 * Both panels now show "User name"/"Password" fields with the same labels
 * (per mockup-sign-on.html), so every query is scoped to its panel via the
 * section's aria-label (signin.tsx) rather than a bare screen.getByLabelText.
 */
function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/users/profile" element={<p>Profile screen</p>} />
        <Route path="/users/create" element={<p>Create-customer screen</p>} />
        <Route path="/cart" element={<p>Cart screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function returningPanel() {
  return within(screen.getByRole("region", { name: "Returning customer" }));
}

function newCustomerPanel() {
  return within(screen.getByRole("region", { name: "New customer" }));
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
    expect(returningPanel().getByLabelText("User name")).toHaveAttribute("name", "j_username");
    const passwordInput = returningPanel().getByLabelText("Password");
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

    expect(returningPanel().getByLabelText("User name")).toHaveValue("jgarrett");
  });

  it("leaves the user name field empty when there is no bp_signon cookie", () => {
    renderAt("/signin");

    expect(returningPanel().getByLabelText("User name")).toHaveValue("");
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

    await user.type(returningPanel().getByLabelText("User name"), "jgarrett");
    await user.type(returningPanel().getByLabelText("Password"), "correct-horse-1");
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

    await user.type(returningPanel().getByLabelText("User name"), "jgarrett");
    await user.type(returningPanel().getByLabelText("Password"), "correct-horse-1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Profile screen")).toBeInTheDocument();
  });

  describe("sign-on failure (SWHR3-T-0009)", () => {
    function stubFailedSignIn() {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ message: "Invalid user name or password" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );
    }

    it('shows the designed error banner above both panels with role="alert" and the exact legacy message (AC-1, AC-4)', async () => {
      stubFailedSignIn();
      const user = userEvent.setup();
      renderAt("/signin");

      await user.type(returningPanel().getByLabelText("User name"), "jgarrett");
      await user.type(returningPanel().getByLabelText("Password"), "wrong-password");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("There were errors signing you in");
      expect(alert).toHaveTextContent(
        "The user name and password you entered were not found in our records.",
      );
      expect(screen.queryByText("Profile screen")).not.toBeInTheDocument();
    });

    it("clears the password field and keeps the user name after a failed sign-in, and does not navigate (AC-2)", async () => {
      stubFailedSignIn();
      const user = userEvent.setup();
      renderAt("/signin");

      await user.type(returningPanel().getByLabelText("User name"), "jgarrett");
      await user.type(returningPanel().getByLabelText("Password"), "wrong-password");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await screen.findByRole("alert");
      expect(returningPanel().getByLabelText("User name")).toHaveValue("jgarrett");
      expect(returningPanel().getByLabelText("Password")).toHaveValue("");
      expect(returningPanel().getByLabelText("Password")).toHaveFocus();
      expect(screen.queryByText("Profile screen")).not.toBeInTheDocument();
    });

    it("clears the banner as soon as the next submit starts, before the response arrives", async () => {
      stubFailedSignIn();
      const user = userEvent.setup();
      renderAt("/signin");

      await user.type(returningPanel().getByLabelText("User name"), "jgarrett");
      await user.type(returningPanel().getByLabelText("Password"), "wrong-password");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await screen.findByRole("alert");

      let resolveSecondAttempt: (response: Response) => void = () => {};
      vi.stubGlobal(
        "fetch",
        vi.fn(
          () =>
            new Promise<Response>((resolve) => {
              resolveSecondAttempt = resolve;
            }),
        ),
      );
      await user.type(returningPanel().getByLabelText("Password"), "correct-horse-1");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      resolveSecondAttempt(
        new Response(JSON.stringify({ user: { id: 1, username: "jgarrett" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  describe("New customer panel (SWHR3-T-0008)", () => {
    it("renders the registration fields, a Confirm password field, and a Create new account button (AC-1)", () => {
      renderAt("/signin");

      const panel = newCustomerPanel();
      expect(panel.getByLabelText("User name")).toHaveAttribute("name", "j_username");
      const passwordInput = panel.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("name", "j_password");
      expect(passwordInput).toHaveAttribute("type", "password");
      const confirmInput = panel.getByLabelText("Confirm password");
      expect(confirmInput).toHaveAttribute("name", "j_password_confirm");
      expect(confirmInput).toHaveAttribute("type", "password");
      expect(panel.getByRole("button", { name: "Create new account" })).toBeInTheDocument();
    });

    it("submits j_username/j_password/j_password_confirm and navigates to /users/create on success (AC-2, AC-3, AC-4, AC-5)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 5, username: "newcustomer1" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderAt("/signin");
      const panel = newCustomerPanel();

      await user.type(panel.getByLabelText("User name"), "newcustomer1");
      await user.type(panel.getByLabelText("Password"), "correct-horse-1");
      await user.type(panel.getByLabelText("Confirm password"), "correct-horse-1");
      await user.click(panel.getByRole("button", { name: "Create new account" }));

      expect(await screen.findByText("Create-customer screen")).toBeInTheDocument();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/auth/register");
      expect(JSON.parse(init.body as string)).toEqual({
        j_username: "newcustomer1",
        j_password: "correct-horse-1",
        j_password_confirm: "correct-horse-1",
      });
    });

    it('shows "That user name is already taken" and keeps the entered user name on a 409 (AC-6)', async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              message: "An account with this user name already exists",
              data: { code: "DUPLICATE_ACCOUNT" },
            }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          ),
        ),
      );
      const user = userEvent.setup();
      renderAt("/signin");
      const panel = newCustomerPanel();

      await user.type(panel.getByLabelText("User name"), "jgarrett");
      await user.type(panel.getByLabelText("Password"), "correct-horse-1");
      await user.type(panel.getByLabelText("Confirm password"), "correct-horse-1");
      await user.click(panel.getByRole("button", { name: "Create new account" }));

      expect(
        await screen.findByRole("heading", { name: "That user name is already taken" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/jgarrett/)).toBeInTheDocument();
      expect(newCustomerPanel().getByLabelText("User name")).toHaveValue("jgarrett");
      expect(screen.queryByText("Create-customer screen")).not.toBeInTheDocument();
    });

    it("reports a password/confirmation mismatch on the confirmation field and sends no request (AC-7)", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const user = userEvent.setup();
      renderAt("/signin");
      const panel = newCustomerPanel();

      await user.type(panel.getByLabelText("User name"), "newcustomer1");
      await user.type(panel.getByLabelText("Password"), "correct-horse-1");
      await user.type(panel.getByLabelText("Confirm password"), "different-horse-1");
      await user.click(panel.getByRole("button", { name: "Create new account" }));

      expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
