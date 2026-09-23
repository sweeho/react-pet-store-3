import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOutButton } from "./sign-out-button";

/**
 * UI / COMPONENT TEST
 *
 * Mocks global fetch (same pattern as src/utils/api.test.ts) and renders
 * inside a MemoryRouter so useNavigate has a real router context, then
 * asserts the AC-7 behaviour: post to /api/auth/signout, then navigate to
 * /signin.
 */
function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/account/profile" element={<SignOutButton />} />
        <Route path="/signin" element={<p>Sign in screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SignOutButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /api/auth/signout and then navigates to /signin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderAt("/account/profile");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/signout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByText("Sign in screen")).toBeInTheDocument();
  });

  it("still navigates to /signin if the sign-out request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const user = userEvent.setup();
    renderAt("/account/profile");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Sign in screen")).toBeInTheDocument();
  });
});
