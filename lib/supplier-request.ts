/**
 * The supplier inventory form (design.md D7, C6, supplier-portal-and-
 * inventory): the legacy field names, sent as a flat JSON object. Each row is
 * `qty_<itemId>` (text) and `item_<itemId>` (checkbox). Only ticked rows with
 * a whole-number quantity of 0 or more are kept; every other row is skipped
 * silently, as the spec requires.
 */
export const QTY_FIELD_PREFIX = "qty_";
export const ITEM_FIELD_PREFIX = "item_";

function isTicked(value: unknown): boolean {
  return value === true || value === "on" || value === "true";
}

/** A whole number of 0 or more, from an ASCII-digit string (trimmed) or a JSON number. */
function parseQuantity(value: unknown): number | null {
  const number =
    typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value.trim())
      : typeof value === "number"
        ? value
        : Number.NaN;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function parseInventoryForm(body: unknown): { itemId: string; quantity: number }[] {
  if (typeof body !== "object" || body === null) {
    return [];
  }
  const fields = body as Record<string, unknown>;
  const updates: { itemId: string; quantity: number }[] = [];

  for (const [key, ticked] of Object.entries(fields)) {
    if (!key.startsWith(ITEM_FIELD_PREFIX) || !isTicked(ticked)) {
      continue;
    }
    const itemId = key.slice(ITEM_FIELD_PREFIX.length);
    const quantity = itemId === "" ? null : parseQuantity(fields[`${QTY_FIELD_PREFIX}${itemId}`]);
    if (quantity !== null) {
      updates.push({ itemId, quantity });
    }
  }
  return updates;
}
