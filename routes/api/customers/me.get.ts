/**
 * GET /api/customers/me (design.md C15): the signed-in account's own
 * profile. 401 without a session (requireSessionUser, C8), 404 via
 * NotFoundError when the account has no profile yet.
 */
import { defineHandler } from "nitro/h3";

import { getCustomerProfile } from "../../../lib/customers";
import { NotFoundError, toHttpError } from "../../../lib/errors";
import { requireSessionUser } from "../../../lib/session";

export default defineHandler(async (event) => {
  try {
    const user = await requireSessionUser(event);
    const customer = await getCustomerProfile(user.id);
    if (!customer) {
      throw new NotFoundError("Customer profile not found");
    }
    return { customer };
  } catch (error) {
    throw toHttpError(error);
  }
});
