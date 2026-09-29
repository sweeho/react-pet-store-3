/**
 * POST /api/orders (design.md C9, D7, D8, D9): places an order from the flat
 * checkout request and the caller's cart. The account comes from the session,
 * never the body; the cart from the cart cookie. Answers 201 with the new
 * order's id, date and notification email. Only application/json bodies are
 * accepted (415 otherwise, checked after authentication and before the body
 * is read).
 */
import { defineHandler, setResponseStatus } from "nitro/h3";

import { resolveCartLocale } from "../../../lib/cart-locale";
import { placeOrder } from "../../../lib/checkout";
import { parseCheckoutRequest } from "../../../lib/checkout-request";
import { toHttpError } from "../../../lib/errors";
import { readJsonBody } from "../../../lib/json-body";
import { requireSessionUser } from "../../../lib/session";

export default defineHandler(async (event) => {
  try {
    const user = await requireSessionUser(event);
    const orderEvent = parseCheckoutRequest(await readJsonBody(event));
    const placed = placeOrder({
      accountId: user.id,
      cartToken: event.context.cartSession,
      locale: resolveCartLocale(event),
      event: orderEvent,
    });
    setResponseStatus(event, 201);
    return placed;
  } catch (error) {
    throw toHttpError(error);
  }
});
