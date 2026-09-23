import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CustomerProfile } from "@/types/customer-profile";

import UserProfile from "./profile";

/**
 * UI / PAGE TEST
 *
 * Mocks global fetch as a tiny stateful server (same technique as
 * src/utils/api.test.ts and sign-out-button.test.tsx): GET and PUT both read
 * and write the same in-memory `stored` profile, so re-mounting the page (a
 * stand-in for a browser reload) reads back whatever the last PUT saved.
 */
const BASE_PROFILE: CustomerProfile = {
  username: "jgarrett",
  firstName: "Jane",
  lastName: "Garrett",
  email: "jane.garrett@example.com",
  telephone: "(415) 555-0148",
  address: {
    street1: "1247 Ocean Avenue",
    street2: "Apt 3B",
    city: "San Francisco",
    state: "California",
    postalCode: "94122",
    country: "United States",
  },
  card: {
    cardType: "Visa",
    cardNumberLast4: "4218",
    expiryMonth: 12,
    expiryYear: 2028,
  },
  preferences: {
    locale: "en_US",
    favoriteCategory: "DOGS",
    myListEnabled: true,
    petTipsEnabled: false,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubProfileServer(initialProfile: CustomerProfile) {
  let stored = initialProfile;
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url !== "/api/customers/me") {
      throw new Error(`unexpected fetch: ${url}`);
    }
    if (!init || init.method === undefined) {
      return Promise.resolve(jsonResponse({ customer: stored }));
    }
    if (init.method === "PUT") {
      const body = JSON.parse(init.body as string) as {
        firstName: string;
        lastName: string;
        email: string;
        telephone: string;
        address: CustomerProfile["address"];
        card: {
          cardType: CustomerProfile["card"]["cardType"];
          cardNumber: string;
          expiryMonth: number;
          expiryYear: number;
        };
        preferences: CustomerProfile["preferences"];
      };
      stored = {
        username: stored.username,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        telephone: body.telephone,
        address: body.address,
        card: {
          cardType: body.card.cardType,
          cardNumberLast4: body.card.cardNumber
            ? body.card.cardNumber.slice(-4)
            : stored.card.cardNumberLast4,
          expiryMonth: body.card.expiryMonth,
          expiryYear: body.card.expiryYear,
        },
        preferences: body.preferences,
      };
      return Promise.resolve(jsonResponse({ customer: stored }));
    }
    throw new Error(`unexpected method: ${init.method}`);
  });
  return fetchMock;
}

class TestErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <p>Something went wrong</p>;
    }
    return this.props.children;
  }
}

function renderProfilePage() {
  return render(
    <TestErrorBoundary>
      <MemoryRouter initialEntries={["/users/profile"]}>
        <Routes>
          <Route path="/users/profile" element={<UserProfile />} />
          <Route path="/users/create" element={<p>Create account screen</p>} />
        </Routes>
      </MemoryRouter>
    </TestErrorBoundary>,
  );
}

describe("UserProfile page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the user name read-only and the card masked to its last four digits", async () => {
    vi.stubGlobal("fetch", stubProfileServer(BASE_PROFILE));

    renderProfilePage();

    expect(await screen.findByText("jgarrett")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /user name/i })).not.toBeInTheDocument();

    const cardNumberInput = screen.getByLabelText(/card number/i) as HTMLInputElement;
    expect(cardNumberInput.value).toBe("");
    expect(cardNumberInput.placeholder).toContain("4218");
    expect(screen.getByText(/ending in 4218/i)).toBeInTheDocument();
  });

  it("edits and saves changes, which persist across a reload", async () => {
    const fetchMock = stubProfileServer(BASE_PROFILE);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { unmount } = renderProfilePage();
    await screen.findByText("jgarrett");

    const firstName = screen.getByLabelText("First name") as HTMLInputElement;
    await user.clear(firstName);
    await user.type(firstName, "Janet");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Janet");
    });

    unmount();
    renderProfilePage();

    const reloadedFirstName = await screen.findByLabelText("First name");
    expect((reloadedFirstName as HTMLInputElement).value).toBe("Janet");
  });

  it("resets the form to the loaded profile when Cancel is clicked", async () => {
    vi.stubGlobal("fetch", stubProfileServer(BASE_PROFILE));
    const user = userEvent.setup();
    renderProfilePage();
    await screen.findByText("jgarrett");

    const firstName = screen.getByLabelText("First name") as HTMLInputElement;
    await user.clear(firstName);
    await user.type(firstName, "Someone Else");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Jane");
  });

  it("shows a Sign out control", async () => {
    vi.stubGlobal("fetch", stubProfileServer(BASE_PROFILE));
    renderProfilePage();

    await screen.findByText("jgarrett");
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("navigates to /users/create when the account has no profile (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ message: "Customer profile not found", data: { code: "NOT_FOUND" } }, 404),
        ),
    );

    renderProfilePage();

    expect(await screen.findByText("Create account screen")).toBeInTheDocument();
  });

  it("throws any other load failure to the app error boundary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Internal server error" }, 500)),
    );

    renderProfilePage();

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });
});
