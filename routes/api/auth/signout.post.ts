/**
 * POST /api/auth/signout (design.md C9): clears the session and answers
 * 204 with no body.
 */
import { defineHandler, noContent } from "nitro/h3";

import { endSession } from "../../../lib/session";

export default defineHandler(async (event) => {
  await endSession(event);
  return noContent();
});
