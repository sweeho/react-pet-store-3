/**
 * PUT /api/customers/me (design.md C15): updates the signed-in account's
 * profile. 401 without a session (requireSessionUser, C8), else the mapped
 * ServiceError status (toHttpError, C2) — including 404 when there is no
 * profile to update yet.
 */
import { defineHandler, readBody } from "nitro/h3";

import { updateCustomer } from "../../../lib/customers";
import { toHttpError } from "../../../lib/errors";
import { requireSessionUser } from "../../../lib/session";

export default defineHandler(async (event) => {
  try {
    const user = await requireSessionUser(event);
    const body = await readBody(event);
    const customer = await updateCustomer(user.id, body);
    return { customer };
  } catch (error) {
    throw toHttpError(error);
  }
});
