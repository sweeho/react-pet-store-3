/**
 * Resolves the session into event.context.user on every request (design.md
 * D7, C10). An active session sets user/locale; a protected API path (the
 * exact-match list in lib/protected-resources.ts, SD10) with no active
 * session 401s with the D7 message — "Session timed out" for an expired
 * session, "Authentication required" for none. A non-protected path never
 * throws, so /api/hello keeps answering signed out.
 *
 * An admin path (design.md D4, the ADMIN_API_PREFIX in
 * lib/protected-resources.ts) gets the same 401 with no active session,
 * plus a 403 ForbiddenError for an active session whose role (read fresh
 * from the db via lib/roles.ts, never the cookie — D3) is not "admin", so a
 * revoked role takes effect on the very next request with no sign-out.
 *
 * A supplier path (design.md D1 of supplier-portal-and-inventory) works the
 * same way but requires the "supplier" role, so store administrators are
 * refused with 403 too.
 */
import { createError, defineHandler, getRequestURL } from "nitro/h3";

import { ForbiddenError, toHttpError } from "../lib/errors";
import { isAdminApiPath, isProtectedApiPath, isSupplierApiPath } from "../lib/protected-resources";
import { getAccountRole } from "../lib/roles";
import { type SessionUser, readSession } from "../lib/session";

declare module "h3" {
  interface H3EventContext {
    user?: SessionUser;
    locale?: string;
  }
}

export default defineHandler(async (event) => {
  const session = await readSession(event);
  const pathname = getRequestURL(event).pathname;

  if (session.status === "active") {
    event.context.user = session.user;
    event.context.locale = session.locale;

    if (isAdminApiPath(pathname) && getAccountRole(session.user.id) !== "admin") {
      throw toHttpError(new ForbiddenError());
    }

    if (isSupplierApiPath(pathname) && getAccountRole(session.user.id) !== "supplier") {
      throw toHttpError(new ForbiddenError("Supplier administrator credentials required"));
    }

    return;
  }

  if (isProtectedApiPath(pathname) || isAdminApiPath(pathname) || isSupplierApiPath(pathname)) {
    throw createError({
      status: 401,
      message: session.status === "expired" ? "Session timed out" : "Authentication required",
    });
  }
});
