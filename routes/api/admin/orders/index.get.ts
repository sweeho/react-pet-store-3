/**
 * GET /api/admin/orders (design.md D5, contracts C3/C6): every order,
 * grouped into all four ORDER_STATUSES keys. Admin-only enforcement is a
 * prefix rule in middleware/auth.ts (D4) owned by another ticket — this
 * handler does not itself check the caller's role.
 */
import { defineHandler } from "nitro/h3";

export default defineHandler(() => {
  throw new Error("VortexNotImplemented");
});
