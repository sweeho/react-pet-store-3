/**
 * Resolves the session into event.context.user on every request (design.md
 * D7, C10). An active session sets user/locale; a protected API path (the
 * exact-match list in lib/protected-resources.ts, SD10) with no active
 * session 401s with the D7 message — "Session timed out" for an expired
 * session, "Authentication required" for none. A non-protected path never
 * throws, so /api/hello keeps answering signed out.
 */
import { createError, defineHandler, getRequestURL } from "nitro/h3";

import { isProtectedApiPath } from "../lib/protected-resources";
import { type SessionUser, readSession } from "../lib/session";

declare module "h3" {
  interface H3EventContext {
    user?: SessionUser;
    locale?: string;
  }
}

export default defineHandler(async (event) => {
  const session = await readSession(event);

  if (session.status === "active") {
    event.context.user = session.user;
    event.context.locale = session.locale;
    return;
  }

  const pathname = getRequestURL(event).pathname;
  if (isProtectedApiPath(pathname)) {
    throw createError({
      status: 401,
      message: session.status === "expired" ? "Session timed out" : "Authentication required",
    });
  }
});
