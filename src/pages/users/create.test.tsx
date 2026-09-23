import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CreateCustomer from "./create";

/**
 * UI / PAGE TEST
 *
 * Mocks global fetch (same technique as profile.test.tsx / api.test.ts).
 * GET /api/session supplies the read-only user name; POST /api/customers
 * is mocked per test since the real handler is built in parallel by
 * SWHR3-T-0015 against contract C15 (PLAN.md Notes).
 */
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sessionResponse() {
  return jsonResponse({ user: { id: 7, username: "jgarrett" }, locale: "en_US", expired: false });
}

function renderCreatePage() {
  return render(
    <MemoryRouter initialEntries={["/users/create"]}>
      <Routes>
        <Route path="/users/create" element={<CreateCustomer />} />
        <Route path="/users/profile" element={<p>Profile screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First name"), "Jane");
  await user.type(screen.getByLabelText("Last name"), "Garrett");
  await user.type(screen.getByLabelText("Street address"), "1247 Ocean Avenue");
  await user.type(screen.getByLabelText("City"), "San Francisco");
  await user.type(screen.getByLabelText("State / Province"), "California");
  await user.type(screen.getByLabelText("ZIP / Postal code"), "94122");
  await user.type(screen.getByLabelText("Country"), "United States");
  await user.type(screen.getByLabelText("Telephone"), "(415) 555-0148");
  await user.type(screen.getByLabelText("Email"), "jane.garrett@example.com");
  await user.type(screen.getByLabelText("Card number"), "4111111111111111");
  await user.selectOptions(screen.getByLabelText("Favourite category"), "DOGS");
}

describe("CreateCustomer page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the signed-in user name read-only, and the three sections with their fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse()));

    renderCreatePage();

    expect(await screen.findByText("jgarrett")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "jgarrett" })).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Contact information" })).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Street address")).toBeInTheDocument();
    expect(screen.getByLabelText("Street address line 2 (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("State / Province")).toBeInTheDocument();
    expect(screen.getByLabelText("ZIP / Postal code")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Telephone")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Credit card" })).toBeInTheDocument();
    expect(screen.getByLabelText("Card type")).toBeInTheDocument();
    expect(screen.getByLabelText("Card number")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiry month")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiry year")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred language")).toBeInTheDocument();
    expect(screen.getByLabelText("Favourite category")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Show MyList on the home page/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Show pet tips banners/ })).toBeInTheDocument();
  });

  it("marks every field required except Street address line 2 (AC-5)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sessionResponse()));

    renderCreatePage();
    await screen.findByText("jgarrett");

    expect(screen.getByLabelText("First name")).toBeRequired();
    expect(screen.getByLabelText("Street address")).toBeRequired();
    expect(screen.getByLabelText("Street address line 2 (optional)")).not.toBeRequired();
    expect(screen.getByLabelText("City")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Card number")).toBeRequired();
    expect(screen.getByLabelText("Favourite category")).toBeRequired();
  });

  it("blocks submission when a required field is empty (AC-5)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderCreatePage();
    await screen.findByText("jgarrett");
    fetchMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a CustomerProfileInput to POST /api/customers and navigates to /users/profile on 201", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return Promise.resolve(sessionResponse());
      }
      return Promise.resolve(jsonResponse({ customer: { username: "jgarrett" } }, 201));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderCreatePage();
    await screen.findByText("jgarrett");
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Profile screen")).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall?.[0]).toBe("/api/customers");
    const body = JSON.parse((postCall?.[1]?.body as string) ?? "{}");
    expect(body).toMatchObject({
      firstName: "Jane",
      lastName: "Garrett",
      email: "jane.garrett@example.com",
      telephone: "(415) 555-0148",
      address: {
        street1: "1247 Ocean Avenue",
        street2: "",
        city: "San Francisco",
        state: "California",
        postalCode: "94122",
        country: "United States",
      },
      card: { cardNumber: "4111111111111111" },
      preferences: { favoriteCategory: "DOGS" },
    });
  });

  it("maps 422 field errors under their fields and keeps every entered value", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return Promise.resolve(sessionResponse());
      }
      return Promise.resolve(
        jsonResponse(
          {
            message: "Validation failed",
            data: {
              code: "VALIDATION_FAILED",
              fieldErrors: {
                firstName: "First name is required",
                "card.cardNumber": "Card number must be 12-19 digits",
              },
            },
          },
          422,
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderCreatePage();
    await screen.findByText("jgarrett");
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Card number must be 12-19 digits")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveValue("Jane");
    expect(screen.getByLabelText("Email")).toHaveValue("jane.garrett@example.com");
    expect(screen.getByLabelText("Card number")).toHaveValue("4111111111111111");
  });

  it("shows the duplicate-email error under Email on a 409", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return Promise.resolve(sessionResponse());
      }
      return Promise.resolve(
        jsonResponse(
          {
            message: "An account already exists with this email",
            data: { code: "DUPLICATE_EMAIL" },
          },
          409,
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderCreatePage();
    await screen.findByText("jgarrett");
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account already exists with this email"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("jane.garrett@example.com");
  });
});
