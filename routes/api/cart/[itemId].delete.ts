/** DELETE /api/cart/:itemId (design.md C9): removes one item. */
import { defineHandler, getRouterParam } from "nitro/h3";

import { applyRequestAction, parseRemoveRequest } from "../../../lib/cart-request";
import { toHttpError } from "../../../lib/errors";

export default defineHandler((event) => {
  try {
    return applyRequestAction(event, parseRemoveRequest(getRouterParam(event, "itemId")));
  } catch (error) {
    throw toHttpError(error);
  }
});
