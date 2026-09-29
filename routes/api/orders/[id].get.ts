/**
 * GET /api/orders/:id (design.md C9, D7): the signed-in account's own order.
 * 401 signed out; 404 for an unknown id, a non-integer id, or another
 * account's order (never a 403, so ids cannot be probed).
 */
import { defineHandler, getRouterParam } from "nitro/h3";

import { NotFoundError, toHttpError } from "../../../lib/errors";
import { getOrderConfirmation } from "../../../lib/order-confirmation";
import { requireSessionUser } from "../../../lib/session";

export default defineHandler(async (event) => {
  try {
    const user = await requireSessionUser(event);
    const raw = getRouterParam(event, "id") ?? "";
    if (!/^\d+$/.test(raw)) {
      throw new NotFoundError("Order not found");
    }
    return getOrderConfirmation(user.id, Number(raw));
  } catch (error) {
    throw toHttpError(error);
  }
});
