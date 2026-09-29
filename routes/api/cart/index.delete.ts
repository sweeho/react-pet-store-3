/** DELETE /api/cart (design.md C9): empties the cart. */
import { defineHandler } from "nitro/h3";

import { applyRequestAction } from "../../../lib/cart-request";
import { toHttpError } from "../../../lib/errors";

export default defineHandler((event) => {
  try {
    return applyRequestAction(event, { type: "EMPTY" });
  } catch (error) {
    throw toHttpError(error);
  }
});
