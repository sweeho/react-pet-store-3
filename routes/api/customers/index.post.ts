/**
 * POST /api/customers (design.md C15): creates the signed-in account's
 * customer profile. 401 without a session (requireSessionUser, C8), 201 on
 * success, else the mapped ServiceError status (toHttpError, C2).
 */
import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { createCustomer } from "../../../lib/customers";
import { toHttpError } from "../../../lib/errors";
import { requireSessionUser } from "../../../lib/session";

export default defineHandler(async (event) => {
  try {
    const user = await requireSessionUser(event);
    const body = await readBody(event);
    const customer = await createCustomer(user.id, body);
    setResponseStatus(event, 201);
    return { customer };
  } catch (error) {
    throw toHttpError(error);
  }
});
