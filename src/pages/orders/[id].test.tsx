import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OrderConfirmation } from "@/types/checkout";
import { ApiError } from "@/utils/api";
import { getOrder } from "@/utils/orders-api";
import OrderConfirmationPage from "./[id]";

/**
 * UI / PAGE TEST. Builds the confirmation mockup's main content
 * (mockup-order-confirmation.html); storefront chrome is out of scope (SD12).
 */
vi.mock("@/utils/orders-api", () => ({ getOrder: vi.fn() }));

const CONTACT = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1247 Larkspur Avenue",
  address2: "Apt 3B",
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "United States",
  telephoneNumber: "+1 650 555 0134",
  email: "sarah.chen@example.com",
};
const ORDER: OrderConfirmation = {
  orderId: 1001482,
  orderDate: "2026-09-23T10:15:00.000Z",
  email: "sarah.chen@example.com",
  billTo: CONTACT,
  shipTo: {
    ...CONTACT,
    address1: "88 Market Street",
    address2: null,
    city: "San Francisco",
    postalCode: "94103",
    telephoneNumber: "+1 415 555 0177",
    email: "gift@example.com",
  },
  card: { cardType: "Java Card", last4: "4412", expiryDate: "03/2029" },
  lines: [
    {
      itemId: "EST-6",
      productId: "K9-BD-01",
      category: "DOGS",
      name: "Male Adult Bulldog",
      attribute: "Spotted",
      quantity: 1,
      unitCostCents: 1850,
      totalCostCents: 1850,
    },
    {
      itemId: "EST-11",
      productId: "RP-SN-01",
      category: "REPTILES",
      name: "Venomless Rattlesnake",
      attribute: "Green",
      quantity: 2,
      unitCostCents: 1850,
      totalCostCents: 3700,
    },
  ],
  totalCents: 5550,
};

function renderPage(id = "1001482") {
  return render(
    <MemoryRouter initialEntries={[`/orders/${id}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />
        <Route path="/signin" element={<p>Sign-in screen</p>} />
        <Route path="/" element={<p>Home screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("/orders/:id", () => {
  it("[SWHR3-C-0126] shows the notification email, order number and date", async () => {
    vi.mocked(getOrder).mockResolvedValue(ORDER);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Thank you — your order has been received" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Notifications sent to")).toBeInTheDocument();
    expect(screen.getAllByText("sarah.chen@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("1001482")).toBeInTheDocument();
    expect(screen.getByText("23 September 2026")).toBeInTheDocument();
    expect(getOrder).toHaveBeenCalledWith(1001482);
  });

  it("lists the lines with their totals and the order total", async () => {
    vi.mocked(getOrder).mockResolvedValue(ORDER);

    renderPage();

    const ordered = within(await screen.findByRole("region", { name: "What you ordered" }));
    expect(ordered.getByText("Male Adult Bulldog")).toBeInTheDocument();
    expect(ordered.getByText(/EST-11 · \$18\.50 × 2/)).toBeInTheDocument();
    expect(ordered.getByText("$37.00")).toBeInTheDocument();
    expect(ordered.getByText("$55.50")).toBeInTheDocument();
  });

  it("shows both addresses and the masked card with its expiry", async () => {
    vi.mocked(getOrder).mockResolvedValue(ORDER);

    renderPage();

    const billed = within(await screen.findByRole("group", { name: "Billed to" }));
    expect(billed.getByText(/1247 Larkspur Avenue, Apt 3B/)).toBeInTheDocument();
    expect(billed.getByText(/Palo Alto, CA 94301/)).toBeInTheDocument();
    const shipped = within(screen.getByRole("group", { name: "Shipped to" }));
    expect(shipped.getByText(/88 Market Street/)).toBeInTheDocument();
    expect(shipped.getByText(/San Francisco, CA 94103/)).toBeInTheDocument();
    expect(screen.getByText("Java Card ending 4412 · Expires 03/2029")).toBeInTheDocument();
  });

  it("links Continue shopping to the home page", async () => {
    vi.mocked(getOrder).mockResolvedValue(ORDER);

    renderPage();

    expect(await screen.findByRole("link", { name: "Continue shopping" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("sends a 401 to /signin", async () => {
    vi.mocked(getOrder).mockRejectedValue(new ApiError({ status: 401, message: "Unauthorized" }));

    renderPage();

    expect(await screen.findByText("Sign-in screen")).toBeInTheDocument();
  });

  it("shows a not-found alert for a 404", async () => {
    vi.mocked(getOrder).mockRejectedValue(new ApiError({ status: 404, message: "Not found" }));

    renderPage("999");

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not find that order.");
  });

  it("shows a not-found alert without calling the API for a non-numeric id", async () => {
    renderPage("abc");

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not find that order.");
    expect(getOrder).not.toHaveBeenCalled();
  });
});
