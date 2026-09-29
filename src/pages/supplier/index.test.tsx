import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InventoryRow, InventoryUpdateResult } from "@/types/supplier";
import { getInventory, updateInventory } from "@/utils/supplier-api";
import SupplierInventory from "./index";

/**
 * UI / PAGE TEST. design.md D7, D8, SD7 (supplier-portal-and-inventory): the
 * page lists every item, submits ticked rows through updateInventory, and
 * shows the success banner. Mocks GET /api/session (RequireSupplier,
 * SupplierShell) and src/utils/supplier-api.ts.
 */
vi.mock("@/utils/supplier-api", () => ({
  getInventory: vi.fn(),
  updateInventory: vi.fn(),
  signOutSupplier: vi.fn(),
}));

const ROWS: InventoryRow[] = [
  { itemId: "EST-1", quantity: 1240 },
  { itemId: "EST-2", quantity: 0 },
  { itemId: "EST-3", quantity: 318 },
];

function stubSession() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            user: { id: 1, username: "Dana Okafor", role: "supplier" },
            locale: "en_US",
            expired: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    ),
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/supplier"]}>
      <Routes>
        <Route path="/supplier" element={<SupplierInventory />} />
      </Routes>
    </MemoryRouter>,
  );
}

const qty = (itemId: string) =>
  document.querySelector<HTMLInputElement>(`input[name="qty_${itemId}"]`) as HTMLInputElement;
const box = (itemId: string) =>
  document.querySelector<HTMLInputElement>(`input[name="item_${itemId}"]`) as HTMLInputElement;

beforeEach(() => {
  stubSession();
  vi.mocked(getInventory).mockResolvedValue(ROWS);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("/supplier", () => {
  it("[SWHR3-C-0185] a supplier sees every item's ID and current quantity", async () => {
    renderPage();

    const rows = await screen.findAllByTestId("inventory-row");
    expect(
      rows.map((row) => [1, 2].map((i) => within(row).getAllByRole("cell")[i].textContent)),
    ).toEqual([
      ["EST-1", "1,240"],
      ["EST-2", "0"],
      ["EST-3", "318"],
    ]);
    expect(screen.getByText("Dana Okafor")).toBeInTheDocument();
    expect(screen.getByText("Supplier administrator")).toBeInTheDocument();
  });

  it("[SWHR3-C-0193] shows the heading, the count line and the four-part rows", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "3 items. Enter a new quantity and tick the row to include it — unticked rows are ignored.",
      ),
    ).toBeInTheDocument();
    const cells = within((await screen.findAllByTestId("inventory-row"))[0]).getAllByRole("cell");
    expect(cells).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Update inventory" })).toBeInTheDocument();
  });

  it("[SWHR3-C-0192] Update inventory sends the rows entered and shows the success banner", async () => {
    const saved: InventoryUpdateResult = {
      updated: ["EST-1", "EST-3"],
      processedOrders: 1,
      fulfilledOrders: 0,
      inventory: [
        { itemId: "EST-1", quantity: 10 },
        { itemId: "EST-2", quantity: 0 },
        { itemId: "EST-3", quantity: 30 },
      ],
    };
    vi.mocked(updateInventory).mockResolvedValue(saved);
    renderPage();
    await screen.findAllByTestId("inventory-row");

    await userEvent.type(qty("EST-1"), "10");
    await userEvent.type(qty("EST-2"), "20");
    await userEvent.type(qty("EST-3"), "30");
    await userEvent.click(box("EST-2"));
    expect(screen.getByText("2 items marked for update")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Update inventory" }));

    await waitFor(() => expect(updateInventory).toHaveBeenCalledTimes(1));
    expect(updateInventory).toHaveBeenCalledWith({
      "qty_EST-1": "10",
      "item_EST-1": true,
      "qty_EST-2": "20",
      "item_EST-2": false,
      "qty_EST-3": "30",
      "item_EST-3": true,
    });
    expect(await screen.findByText("Inventory updated — 2 items saved.")).toBeInTheDocument();
    expect(
      screen.getByText("Pending supplier orders are being reprocessed against the new quantities."),
    ).toBeInTheDocument();
    const rows = screen.getAllByTestId("inventory-row");
    expect(within(rows[0]).getByText("updated")).toBeInTheDocument();
    expect(within(rows[1]).queryByText("updated")).not.toBeInTheDocument();
    expect(within(rows[2]).getByText("updated")).toBeInTheDocument();
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("10");
    expect(qty("EST-1")).toHaveValue("");
  });

  it("[SWHR3-C-0194] no inventory shows an empty-state message", async () => {
    vi.mocked(getInventory).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("No inventory items to show.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("inventory-row")).toHaveLength(0);
  });

  it("a failed update shows a destructive alert and keeps the entries", async () => {
    vi.mocked(updateInventory).mockRejectedValue(new Error("boom"));
    renderPage();
    await screen.findAllByTestId("inventory-row");
    await userEvent.type(qty("EST-1"), "10");

    await userEvent.click(screen.getByRole("button", { name: "Update inventory" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Inventory could not be updated.");
    expect(qty("EST-1")).toHaveValue("10");
  });

  it("a failed load shows an alert", async () => {
    vi.mocked(getInventory).mockRejectedValue(new Error("boom"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Inventory could not be loaded.");
  });
});
