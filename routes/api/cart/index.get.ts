/**
 * GET /api/cart (design.md C9): the caller's cart. No cart cookie is an
 * empty cart, and no cookie is minted for a read (D1).
 */
import { defineHandler } from "nitro/h3";

import { buildCartView } from "../../../lib/cart-request";
import { resolveCartLocale } from "../../../lib/cart-locale";
import { toHttpError } from "../../../lib/errors";

export default defineHandler((event) => {
  try {
    return buildCartView(event.context.cartSession, resolveCartLocale(event));
  } catch (error) {
    throw toHttpError(error);
  }
});
