/**
 * POST /api/admin/orders/status (design.md D5, contracts C4/C5/C6, SD2/SD3/
 * SD5): commits one batch of order status changes. Admin-only enforcement
 * is a prefix rule in middleware/auth.ts (D4) owned by another ticket —
 * this handler does not itself check the caller's role.
 */
import { defineHandler, readBody } from "nitro/h3";

import { toHttpError } from "../../../../lib/errors";
import { updateOrders } from "../../../../lib/order-approval";
import { parseOrderApprovalRequest } from "../../../../lib/order-approval-request";

export default defineHandler(async (event) => {
  try {
    const body = await readBody(event);
    const approval = parseOrderApprovalRequest(body);
    const { updated } = updateOrders(approval);
    return { type: "UPDATEORDERS", status: "SUCCESS", updated };
  } catch (error) {
    throw toHttpError(error);
  }
});
