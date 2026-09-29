import { afterEach, describe, expect, it, vi } from "vitest";

import { commitOrderDecisions, fetchOrdersByStatus } from "./admin-orders-api";
import { ApiError } from "./api";
import type { OrderApprovalRequest } from "@/types/order-approval";

/**
 * UNIT TEST (client project)
 *
 * Both functions go through apiFetch (design.md C11), so the browser's
 * same-origin credentials carry the httpOnly session cookie — the modern
 * stand-in for the legacy JNLP-embedded session id (SD8) — and any non-2xx
 * response surfaces as the same ApiError apiFetch already builds.
 */
describe("fetchOrdersByStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs /api/admin/orders with same-origin credentials and returns the grouped orders", async () => {
    const orders = {
      PENDING: [
        {
          id: 1001,
          customerName: "Alice",
          orderDate: "2026-01-01T00:00:00.000Z",
          totalCents: 1000,
          status: "PENDING",
        },
      ],
      APPROVED: [],
      DENIED: [],
      COMPLETED: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ orders }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOrdersByStatus();

    expect(result).toEqual(orders);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/orders");
    expect(init.credentials).toBe("same-origin");
  });

  it("[SWHR3-C-0029] surfaces a 401 ApiError unchanged when there is no session cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    try {
      await fetchOrdersByStatus();
      expect.unreachable("expected fetchOrdersByStatus to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 401, message: "Authentication required" });
    }
  });
});

describe("commitOrderDecisions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const REQUEST: OrderApprovalRequest = {
    requestType: "UPDATESTATUS",
    changes: [
      { orderId: 1001, status: "APPROVED" },
      { orderId: 1002, status: "DENIED" },
      { orderId: 1005, status: "APPROVED" },
    ],
  };

  it("[SWHR3-C-0007] POSTs /api/admin/orders/status with the whole request body, exactly once", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ type: "UPDATEORDERS", status: "SUCCESS", updated: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await commitOrderDecisions(REQUEST);

    expect(result).toEqual({ type: "UPDATEORDERS", status: "SUCCESS", updated: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/orders/status");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(init.body as string)).toEqual(REQUEST);
  });

  it("surfaces the ApiError unchanged on failure, with status and server message preserved (C11)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Order 1001 is APPROVED and cannot be transitioned",
            data: { code: "INVALID_TRANSITION" },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    try {
      await commitOrderDecisions({
        requestType: "UPDATESTATUS",
        changes: [{ orderId: 1001, status: "APPROVED" }],
      });
      expect.unreachable("expected commitOrderDecisions to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 409,
        message: "Order 1001 is APPROVED and cannot be transitioned",
        code: "INVALID_TRANSITION",
      });
    }
  });

  it("surfaces a 403 ApiError unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              message: "Administrator credentials required",
              data: { code: "FORBIDDEN" },
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    try {
      await commitOrderDecisions(REQUEST);
      expect.unreachable("expected commitOrderDecisions to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 403, message: "Administrator credentials required" });
    }
  });
});
