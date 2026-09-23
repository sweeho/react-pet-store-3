/**
 * GET /api/session (design.md C9): never 401s — it reports the session
 * state so the client guard (SWHR3-T-0011) can decide what to do.
 */
import { defineHandler } from "nitro/h3";

import { AUTH_CONFIG } from "../../lib/auth-config";
import { readSession } from "../../lib/session";

export default defineHandler(async (event) => {
  const session = await readSession(event);

  if (session.status === "active") {
    return { user: session.user, locale: session.locale, expired: false };
  }

  return {
    user: null,
    locale: AUTH_CONFIG.defaultLocale,
    expired: session.status === "expired",
  };
});
