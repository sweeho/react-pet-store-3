/**
 * The supplier portal client (design.md C10, C11, supplier-portal-and-
 * inventory). Every call goes through apiFetch, so a 401 or 403 surfaces as
 * the ApiError it already builds.
 */
import type { InventoryRow, InventoryUpdateResult } from "@/types/supplier";
import { apiFetch } from "./api";

const INVENTORY_PATH = "/api/supplier/inventory";

export function getInventory(): Promise<InventoryRow[]> {
  return apiFetch<{ items: InventoryRow[] }>(INVENTORY_PATH).then((response) => response.items);
}

/** `fields` is the form's flat body: `qty_<itemId>` text and `item_<itemId>` checkbox (D7). */
export function updateInventory(
  fields: Record<string, string | boolean>,
): Promise<InventoryUpdateResult> {
  return apiFetch<InventoryUpdateResult>(INVENTORY_PATH, { method: "POST", body: fields });
}

/** Ends the session; a failed request still counts, as in SignOutButton. */
export async function signOutSupplier(): Promise<void> {
  try {
    await apiFetch("/api/auth/signout", { method: "POST" });
  } catch {
    // Nothing to retry: the cookie is gone or about to be.
  }
}
