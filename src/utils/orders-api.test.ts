import { afterEach, describe, expect, it, vi } from "vitest";

import type { OrderConfirmation, PlacedOrder } from "@/types/checkout";
import { getOrder, placeOrder } from "./orders-api";

/**
 * UNIT TEST (client project). design.md C9/C10: one typed binding per orders
 * endpoint, each through apiFetch.
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

describe("orders-api", () => {
  it("placeOrder POSTs the flat fields to /api/orders and returns the placed order", async () => {
    const placed: PlacedOrder = {
      orderId: 7,
      orderDate: "2026-01-01T00:00:00.000Z",
      email: "a@b.co",
    };
    const fetchMock = stubFetch(placed, 201);

    const result = await placeOrder({ city_a: "Palo Alto", credit_card_type: "Java Card" });

    expect(result).toEqual(placed);
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      city_a: "Palo Alto",
      credit_card_type: "Java Card",
    });
  });

  it("getOrder GETs /api/orders/:id", async () => {
    const confirmation = { orderId: 7 } as OrderConfirmation;
    const fetchMock = stubFetch(confirmation);

    expect(await getOrder(7)).toEqual(confirmation);
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/orders/7");
    expect(init.method ?? "GET").toBe("GET");
  });

  it("surfaces a non-2xx response as an ApiError carrying the server's field errors", async () => {
    stubFetch(
      {
        message: "Validation failed",
        data: { code: "VALIDATION_FAILED", fieldErrors: { city_a: "Enter a city." } },
      },
      422,
    );

    await expect(placeOrder({})).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_FAILED",
      fieldErrors: { city_a: "Enter a city." },
    });
  });
});
