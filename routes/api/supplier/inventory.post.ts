/**
 * POST /api/supplier/inventory (design.md D6, D7, C10, supplier-portal-and-
 * inventory): applies the form's ticked, valid rows in one transaction, then
 * reprocesses pending supplier orders, and answers with the updated item ids,
 * the reprocessing counts and the refreshed inventory. Only application/json
 * bodies are accepted (415 otherwise). Access (the supplier role only) is the
 * prefix rule in middleware/auth.ts (D1); this handler does not itself check
 * the caller's role.
 */
import { defineHandler } from "nitro/h3";

import { toHttpError } from "../../../lib/errors";
import { getInventory } from "../../../lib/inventory";
import { applyInventoryUpdate } from "../../../lib/inventory-update";
import { readJsonBody } from "../../../lib/json-body";
import { parseInventoryForm } from "../../../lib/supplier-request";

export default defineHandler(async (event) => {
  try {
    const updates = parseInventoryForm(await readJsonBody(event));
    const result = applyInventoryUpdate(updates);
    return { ...result, inventory: getInventory() };
  } catch (error) {
    throw toHttpError(error);
  }
});
