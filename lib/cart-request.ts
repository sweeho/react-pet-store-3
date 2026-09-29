/**
 * Turns HTTP requests into CartActions (design.md D8, C6) and builds the
 * CartView every /api/cart route answers with (D9, C9). The legacy
 * NumberFormatException-to-0 rule is parseQuantity (SD4).
 */
import type { H3Event } from "nitro/h3";

import { getCount, getItems, getSubTotalCents } from "./cart";
import { type CartAction, applyCartAction } from "./cart-actions";
import { type CartView, cartItemTotalCostCents } from "./cart-item";
import { resolveCartLocale } from "./cart-locale";
import { ValidationError } from "./errors";

export const ITEM_QUANTITY_FIELD_PREFIX = "itemQuantity_";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A whole-number integer or string (optional leading "-"); anything else is 0. */
export function parseQuantity(value: unknown): number {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : 0;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value);
  }
  return 0;
}

function requireItemId(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError({ itemId: "itemId is required" });
  }
  return value;
}

export function parseAddRequest(body: unknown): CartAction {
  const record = isRecord(body) ? body : {};
  const itemId = requireItemId(record.itemId);
  if (record.quantity === undefined) {
    return { type: "ADD_ITEM", itemId };
  }
  return { type: "ADD_ITEM", itemId, quantity: parseQuantity(record.quantity) };
}

export function parseRemoveRequest(itemId: string | undefined): CartAction {
  return { type: "DELETE_ITEM", itemId: requireItemId(itemId) };
}

export function parseUpdateRequest(body: unknown): CartAction {
  const record = isRecord(body) ? body : {};
  const items: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(ITEM_QUANTITY_FIELD_PREFIX)) {
      items[requireItemId(key.slice(ITEM_QUANTITY_FIELD_PREFIX.length))] = parseQuantity(value);
    }
  }
  return { type: "UPDATE_ITEMS", items };
}

/** The whole cart as the routes answer it; an undefined token is an empty cart. */
export function buildCartView(sessionToken: string | undefined, locale: string): CartView {
  return {
    items: getItems(sessionToken, locale).map((item) => ({
      ...item,
      totalCostCents: cartItemTotalCostCents(item),
    })),
    subtotalCents: getSubTotalCents(sessionToken, locale),
    count: getCount(sessionToken),
    locale,
  };
}

/** Applies a parsed action to the caller's cart and answers with the new CartView. */
export function applyRequestAction(event: H3Event, action: CartAction): CartView {
  const sessionToken = event.context.cartSession;
  if (sessionToken === undefined) {
    throw new Error("cart-session middleware did not run for a cart write");
  }
  applyCartAction(sessionToken, action);
  return buildCartView(sessionToken, resolveCartLocale(event));
}
