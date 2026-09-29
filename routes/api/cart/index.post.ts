/**
 * POST /api/cart (design.md C9, D4): adds an item, refusing one the
 * catalogue does not have with 404 CATALOG_ITEM_NOT_FOUND.
 */
import { defineHandler, readBody } from "nitro/h3";

import { getItem } from "../../../lib/catalog";
import { resolveCartLocale } from "../../../lib/cart-locale";
import { applyRequestAction, parseAddRequest } from "../../../lib/cart-request";
import { toHttpError } from "../../../lib/errors";

export default defineHandler(async (event) => {
  try {
    const action = parseAddRequest(await readBody(event));
    if (action.type === "ADD_ITEM") {
      getItem(action.itemId, resolveCartLocale(event));
    }
    return applyRequestAction(event, action);
  } catch (error) {
    throw toHttpError(error);
  }
});
