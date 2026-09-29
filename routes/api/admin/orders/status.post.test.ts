import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { accounts, orders } from "../../../../db/schema";
import type { OrderStatus } from "../../../../lib/order-status";
import postStatus from "./status.post";

/**
 * INTEGRATION TEST
 *
 * Real-H3Event pattern (see routes/api/customers/me.put.test.ts). Covers
 * design.md C4/C5/C6: parses the body, delegates to lib/order-approval.ts's
 * updateOrders, and answers the C6 success/error shapes. Admin-only
 * enforcement (D4) is out of this ticket's scope (a different ticket owns
 * middleware/auth.ts, see routes/api/admin/orders/index.get.test.ts), so no
 * session is set up here.
 */
function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

function insertOrder(accountId: number, status: OrderStatus = "PENDING") {
  return db
    .insert(orders)
    .values({
      accountId,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1999,
      status,
    })
    .returning()
    .get();
}

function readOrder(id: number) {
  return db.select().from(orders).where(eq(orders.id, id)).get();
}

function makeEvent(body: unknown): H3Event {
  return new H3Event(
    new Request("http://localhost/api/admin/orders/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  db.delete(orders).run();
});

describe("POST /api/admin/orders/status", () => {
  it("[SWHR3-C-0018] a successful commit answers { type: UPDATEORDERS, status: SUCCESS, updated }", async () => {
    const account = makeAccount("status-route-success");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);
    const orderC = insertOrder(account.id);

    const result = await postStatus(
      makeEvent({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: orderB.id, status: "APPROVED" },
          { orderId: orderC.id, status: "APPROVED" },
        ],
      }),
    );

    expect(result).toEqual({ type: "UPDATEORDERS", status: "SUCCESS", updated: 3 });
  });

  it("[SWHR3-C-0013] a valid UPDATESTATUS commit is applied through updateOrders", async () => {
    const account = makeAccount("status-route-applied");
    const orderA = insertOrder(account.id);
    const orderB = insertOrder(account.id);

    const result = await postStatus(
      makeEvent({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: orderA.id, status: "APPROVED" },
          { orderId: orderB.id, status: "DENIED" },
        ],
      }),
    );

    expect(result).toEqual({ type: "UPDATEORDERS", status: "SUCCESS", updated: 2 });
    expect(readOrder(orderA.id)?.status).toBe("APPROVED");
    expect(readOrder(orderB.id)?.status).toBe("DENIED");
  });

  it("[SWHR3-C-0019] a failed commit answers the server's error message, changing nothing (409)", async () => {
    const account = makeAccount("status-route-failed");
    const orderA = insertOrder(account.id, "APPROVED");
    const orderC = insertOrder(account.id, "PENDING");

    await expect(
      postStatus(
        makeEvent({
          requestType: "UPDATESTATUS",
          changes: [
            { orderId: orderA.id, status: "DENIED" },
            { orderId: orderC.id, status: "APPROVED" },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      data: { code: "INVALID_TRANSITION" },
      message: expect.stringMatching(new RegExp(`${orderA.id}.*APPROVED`)),
    });

    expect(readOrder(orderA.id)?.status).toBe("APPROVED");
    expect(readOrder(orderC.id)?.status).toBe("PENDING");
  });

  it("[SWHR3-C-0030] only requestType UPDATESTATUS reaches updateOrders", async () => {
    const account = makeAccount("status-route-request-type");
    const orderA = insertOrder(account.id);

    await expect(
      postStatus(
        makeEvent({
          requestType: "GETORDERS",
          changes: [{ orderId: orderA.id, status: "APPROVED" }],
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      data: { code: "VALIDATION_FAILED", fieldErrors: { requestType: expect.any(String) } },
    });
    expect(readOrder(orderA.id)?.status).toBe("PENDING");

    const result = await postStatus(
      makeEvent({
        requestType: "UPDATESTATUS",
        changes: [{ orderId: orderA.id, status: "APPROVED" }],
      }),
    );

    expect(result).toEqual({ type: "UPDATEORDERS", status: "SUCCESS", updated: 1 });
    expect(readOrder(orderA.id)?.status).toBe("APPROVED");
  });

  it("answers 404 NOT_FOUND for an unknown order id, leaving the batch's other order unchanged (C6)", async () => {
    const account = makeAccount("status-route-unknown-id");
    const orderA = insertOrder(account.id);

    await expect(
      postStatus(
        makeEvent({
          requestType: "UPDATESTATUS",
          changes: [
            { orderId: orderA.id, status: "APPROVED" },
            { orderId: 999999, status: "DENIED" },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      status: 404,
      data: { code: "NOT_FOUND" },
      message: expect.stringContaining("999999"),
    });

    expect(readOrder(orderA.id)?.status).toBe("PENDING");
  });
});
