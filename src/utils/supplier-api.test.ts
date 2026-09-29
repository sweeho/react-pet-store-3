import { afterEach, describe, expect, it, vi } from "vitest";

import type { InventoryUpdateResult } from "@/types/supplier";
import { getInventory, updateInventory } from "./supplier-api";

/**
 * UNIT TEST (client project). design.md C10, C11: one typed binding per
 * supplier inventory endpoint, each through apiFetch.
 */
function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("supplier-api", () => {
  it("getInventory GETs /api/supplier/inventory and returns the rows", async () => {
    const items = [
      { itemId: "EST-1", quantity: 4 },
      { itemId: "EST-2", quantity: 0 },
    ];
    const fetchMock = stubFetch({ items });

    expect(await getInventory()).toEqual(items);
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/supplier/inventory");
    expect(init.method ?? "GET").toBe("GET");
  });

  it("updateInventory POSTs the flat form fields and returns the update result", async () => {
    const result: InventoryUpdateResult = {
      updated: ["EST-1"],
      processedOrders: 2,
      fulfilledOrders: 1,
      inventory: [{ itemId: "EST-1", quantity: 12 }],
    };
    const fetchMock = stubFetch(result);

    const response = await updateInventory({ "qty_EST-1": "12", "item_EST-1": "on" });

    expect(response).toEqual(result);
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/supplier/inventory");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ "qty_EST-1": "12", "item_EST-1": "on" });
  });

  it("surfaces a 403 as an ApiError with its status", async () => {
    stubFetch(
      { message: "Supplier administrator credentials required", data: { code: "FORBIDDEN" } },
      403,
    );

    await expect(getInventory()).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});
