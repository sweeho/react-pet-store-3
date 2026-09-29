/**
 * PUT /api/cart (design.md C9): applies every itemQuantity_<itemId> field
 * in one transaction.
 */
import { defineHandler, readBody } from "nitro/h3";

import { applyRequestAction, parseUpdateRequest } from "../../../lib/cart-request";
import { toHttpError } from "../../../lib/errors";

export default defineHandler(async (event) => {
  try {
    return applyRequestAction(event, parseUpdateRequest(await readBody(event)));
  } catch (error) {
    throw toHttpError(error);
  }
});
