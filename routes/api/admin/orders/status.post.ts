/**
 * POST /api/admin/orders/status (design.md D5, contracts C4/C5/C6, SD2/SD3/
 * SD5): commits one batch of order status changes. Admin-only enforcement
 * is a prefix rule in middleware/auth.ts (D4) owned by another ticket —
 * this handler does not itself check the caller's role.
 */
import { defineHandler } from "nitro/h3";

export default defineHandler(() => {
  throw new Error("VortexNotImplemented");
});
