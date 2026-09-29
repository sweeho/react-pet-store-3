import { describe, expect, it } from "vitest";

import { sortOrders } from "./sort-orders";
import type { SortableOrder } from "./sort-orders";

/**
 * UNIT TEST
 *
 * Exercises sortOrders in isolation (design.md D10/SD1 — the pure
 * client-side stand-in for the legacy TableSorter). Copy this pattern for
 * any new pure helper in src/utils.
 */
const rows: SortableOrder[] = [
  {
    id: 3,
    customerName: "Charlie",
    orderDate: "2026-01-03T00:00:00.000Z",
    totalCents: 500,
    status: "PENDING",
  },
  {
    id: 1,
    customerName: "Alice",
    orderDate: "2026-01-01T00:00:00.000Z",
    totalCents: 1500,
    status: "DENIED",
  },
  {
    id: 2,
    customerName: "Bob",
    orderDate: "2026-01-02T00:00:00.000Z",
    totalCents: 1000,
    status: "APPROVED",
  },
];

describe("sortOrders", () => {
  it("sorts by id ascending and descending", () => {
    expect(sortOrders(rows, { column: "id", direction: "asc" }).map((r) => r.id)).toEqual([
      1, 2, 3,
    ]);
    expect(sortOrders(rows, { column: "id", direction: "desc" }).map((r) => r.id)).toEqual([
      3, 2, 1,
    ]);
  });

  it("sorts by customerName ascending and descending", () => {
    expect(sortOrders(rows, { column: "customerName", direction: "asc" }).map((r) => r.id)).toEqual(
      [1, 2, 3],
    );
    expect(
      sortOrders(rows, { column: "customerName", direction: "desc" }).map((r) => r.id),
    ).toEqual([3, 2, 1]);
  });

  it("sorts by orderDate ascending and descending", () => {
    expect(sortOrders(rows, { column: "orderDate", direction: "asc" }).map((r) => r.id)).toEqual([
      1, 2, 3,
    ]);
    expect(sortOrders(rows, { column: "orderDate", direction: "desc" }).map((r) => r.id)).toEqual([
      3, 2, 1,
    ]);
  });

  it("sorts by totalCents ascending and descending", () => {
    expect(sortOrders(rows, { column: "totalCents", direction: "asc" }).map((r) => r.id)).toEqual([
      3, 2, 1,
    ]);
    expect(sortOrders(rows, { column: "totalCents", direction: "desc" }).map((r) => r.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it("sorts by status ascending and descending", () => {
    // APPROVED < DENIED < PENDING lexicographically
    expect(sortOrders(rows, { column: "status", direction: "asc" }).map((r) => r.id)).toEqual([
      2, 1, 3,
    ]);
    expect(sortOrders(rows, { column: "status", direction: "desc" }).map((r) => r.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it("breaks ties by id ascending, regardless of direction", () => {
    const tied: SortableOrder[] = [
      {
        id: 5,
        customerName: "Same",
        orderDate: "2026-01-01T00:00:00.000Z",
        totalCents: 100,
        status: "PENDING",
      },
      {
        id: 2,
        customerName: "Same",
        orderDate: "2026-01-01T00:00:00.000Z",
        totalCents: 100,
        status: "PENDING",
      },
      {
        id: 8,
        customerName: "Same",
        orderDate: "2026-01-01T00:00:00.000Z",
        totalCents: 100,
        status: "PENDING",
      },
    ];

    expect(sortOrders(tied, { column: "customerName", direction: "asc" }).map((r) => r.id)).toEqual(
      [2, 5, 8],
    );
    expect(
      sortOrders(tied, { column: "customerName", direction: "desc" }).map((r) => r.id),
    ).toEqual([2, 5, 8]);
  });

  it("returns a new array and never mutates its input", () => {
    const original = [...rows];
    const originalOrder = original.map((r) => r.id);

    const result = sortOrders(rows, { column: "id", direction: "desc" });

    expect(result).not.toBe(rows);
    expect(rows.map((r) => r.id)).toEqual(originalOrder);
  });
});
