/**
 * GET /api/supplier/inventory (design.md C10, supplier-portal-and-inventory):
 * every catalogue item with its current quantity, in item order. Access (the
 * supplier role only) is the prefix rule in middleware/auth.ts (D1); this
 * handler does not itself check the caller's role.
 */
import { defineHandler } from "nitro/h3";

import { toHttpError } from "../../../lib/errors";
import { getInventory } from "../../../lib/inventory";

export default defineHandler(() => {
  try {
    return { items: getInventory() };
  } catch (error) {
    throw toHttpError(error);
  }
});
