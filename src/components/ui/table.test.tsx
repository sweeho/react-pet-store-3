import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

/**
 * UI / COMPONENT TEST
 */
describe("Table", () => {
  it("renders a native table with header and body rows", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1001</TableCell>
            <TableCell>Marion Delacroix</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Order" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Marion Delacroix" })).toBeInTheDocument();
  });

  it("forwards a caller's aria-sort to the underlying header cell", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead aria-sort="ascending">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>,
    );

    expect(screen.getByRole("columnheader", { name: "Date" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("merges a caller's className with its own styling", () => {
    render(
      <Table data-testid="orders-table" className="my-table">
        <TableBody />
      </Table>,
    );

    expect(screen.getByTestId("orders-table")).toHaveClass("my-table");
  });
});
