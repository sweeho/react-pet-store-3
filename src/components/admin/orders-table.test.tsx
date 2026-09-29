import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useStagedDecisions } from "@/hooks/use-staged-decisions";
import type { OrderRow } from "@/types/order-approval";

import { OrdersTable } from "./orders-table";
import type { OrdersTableSort } from "./orders-table";

/**
 * UI / COMPONENT TEST
 *
 * OrdersTable is a controlled component (design.md C12): selection, staged
 * decisions and sort all live in props the caller owns. The linked cases
 * (SWHR3-C-0004, SWHR3-C-0006) call for it "wired to useStagedDecisions",
 * so EditableHarness below wires the real hook rather than a mock, the way
 * the eventual /admin/orders page will.
 */
function makeRow(overrides: Partial<OrderRow> & { id: number }): OrderRow {
  return {
    customerName: `Customer ${overrides.id}`,
    orderDate: "2026-09-21T16:40:00.000Z",
    totalCents: 124500,
    status: "PENDING",
    ...overrides,
  };
}

function rowFor(orderId: number): HTMLElement {
  const cell = screen.getByRole("cell", { name: String(orderId) });
  const row = cell.closest("tr");
  if (!row) {
    throw new Error(`no <tr> ancestor for order ${orderId}`);
  }
  return row;
}

function EditableHarness({ rows }: { rows: OrderRow[] }) {
  const staging = useStagedDecisions();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sort, setSort] = useState<OrdersTableSort>({ column: "id", direction: "asc" });

  return (
    <OrdersTable
      rows={rows}
      editable
      staged={staging.staged}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      onStage={staging.stage}
      sort={sort}
      onSortChange={setSort}
    />
  );
}

describe("OrdersTable", () => {
  it("[SWHR3-C-0004] approving one selected pending row stages it as APPROVED", async () => {
    const user = userEvent.setup();
    render(
      <EditableHarness
        rows={[makeRow({ id: 1001 }), makeRow({ id: 1002 }), makeRow({ id: 1003 })]}
      />,
    );

    await user.click(within(rowFor(1001)).getByRole("checkbox", { name: /select order 1001/i }));
    await user.click(screen.getByRole("button", { name: "Approve selected" }));

    const row1001 = rowFor(1001);
    expect(within(row1001).getByRole("combobox")).toHaveValue("APPROVED");
    expect(within(row1001).getByText("Staged")).toBeInTheDocument();

    for (const id of [1002, 1003]) {
      const row = rowFor(id);
      expect(within(row).getByRole("combobox")).toHaveValue("");
      expect(within(row).queryByText("Staged")).not.toBeInTheDocument();
    }
  });

  it("[SWHR3-C-0006] denying several selected rows stages each as DENIED", async () => {
    const user = userEvent.setup();
    render(
      <EditableHarness
        rows={[
          makeRow({ id: 1001 }),
          makeRow({ id: 1002 }),
          makeRow({ id: 1003 }),
          makeRow({ id: 1004 }),
        ]}
      />,
    );

    for (const id of [1001, 1002, 1004]) {
      await user.click(
        within(rowFor(id)).getByRole("checkbox", { name: new RegExp(`select order ${id}`, "i") }),
      );
    }
    await user.click(screen.getByRole("button", { name: "Deny selected" }));

    for (const id of [1001, 1002, 1004]) {
      const row = rowFor(id);
      expect(within(row).getByRole("combobox")).toHaveValue("DENIED");
      expect(within(row).getByText("Staged")).toBeInTheDocument();
    }
    const row1003 = rowFor(1003);
    expect(within(row1003).getByRole("combobox")).toHaveValue("");
  });

  it("[SWHR3-C-0024] the row status select offers only APPROVED and DENIED", () => {
    render(<EditableHarness rows={[makeRow({ id: 1001 })]} />);

    const select = within(rowFor(1001)).getByRole("combobox");
    const optionLabels = within(select)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(optionLabels).toEqual(expect.arrayContaining(["APPROVED", "DENIED"]));
    expect(optionLabels).not.toContain("PENDING");
    expect(optionLabels).not.toContain("COMPLETED");
  });

  it("[SWHR3-C-0025] a read-only (editable=false) table renders no checkbox, select or bulk controls", () => {
    render(
      <OrdersTable
        rows={[makeRow({ id: 998, status: "APPROVED" }), makeRow({ id: 999, status: "COMPLETED" })]}
        editable={false}
        staged={new Map()}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onStage={vi.fn()}
        sort={{ column: "id", direction: "asc" }}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve selected" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deny selected" })).not.toBeInTheDocument();
    expect(within(rowFor(998)).getByText("APPROVED")).toBeInTheDocument();
    expect(within(rowFor(999)).getByText("COMPLETED")).toBeInTheDocument();
  });

  it("contract C12: editable=false renders no checkboxes, status select or Approve/Deny controls (alias of SWHR3-C-0025)", () => {
    render(
      <OrdersTable
        rows={[makeRow({ id: 1, status: "DENIED" })]}
        editable={false}
        staged={new Map()}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onStage={vi.fn()}
        sort={{ column: "id", direction: "asc" }}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("toggles ascending/descending sort through onSortChange and exposes it via aria-sort", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <OrdersTable
        rows={[makeRow({ id: 1001 })]}
        editable={false}
        staged={new Map()}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onStage={vi.fn()}
        sort={{ column: "orderDate", direction: "asc" }}
        onSortChange={onSortChange}
      />,
    );

    const dateHeader = screen.getByRole("columnheader", { name: /date/i });
    expect(dateHeader).toHaveAttribute("aria-sort", "ascending");

    await user.click(within(dateHeader).getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({ column: "orderDate", direction: "desc" });

    const amountHeader = screen.getByRole("columnheader", { name: /amount/i });
    expect(amountHeader).toHaveAttribute("aria-sort", "none");
    await user.click(within(amountHeader).getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({ column: "totalCents", direction: "asc" });
  });

  it("formats amounts as dollars with two decimals from totalCents", () => {
    render(
      <OrdersTable
        rows={[makeRow({ id: 1001, totalCents: 124500 }), makeRow({ id: 1002, totalCents: 50 })]}
        editable={false}
        staged={new Map()}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onStage={vi.fn()}
        sort={{ column: "id", direction: "asc" }}
        onSortChange={vi.fn()}
      />,
    );

    expect(within(rowFor(1001)).getByText("$1,245.00")).toBeInTheDocument();
    expect(within(rowFor(1002)).getByText("$0.50")).toBeInTheDocument();
  });
});
