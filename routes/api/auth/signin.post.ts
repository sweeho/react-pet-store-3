/**
 * POST /api/auth/signin (design.md C11, D6, SD1/SD2): verifies credentials
 * via lib/accounts.ts (C6), starts a session on a match (C8), and sets or
 * clears the bp_signon "remember my user name" cookie per
 * j_remember_username. Every error, including the 401 for no match, is
 * routed through toHttpError (C2) so the response shape is always the one
 * src/utils/api.ts expects.
 */
import { createError, defineHandler, deleteCookie, readBody, setCookie } from "nitro/h3";

import { verifyCredentials } from "../../../lib/accounts";
import { AUTH_CONFIG } from "../../../lib/auth-config";
import { ValidationError, toHttpError } from "../../../lib/errors";
import { startSession } from "../../../lib/session";

interface SignInBody {
  j_username?: unknown;
  j_password?: unknown;
  j_remember_username?: unknown;
}

export default defineHandler(async (event) => {
  try {
    const body = await readBody<SignInBody>(event);

    const username = typeof body?.j_username === "string" ? body.j_username : "";
    const password = typeof body?.j_password === "string" ? body.j_password : "";
    const remember = body?.j_remember_username === true;

    const fieldErrors: Record<string, string> = {};
    if (!username) {
      fieldErrors.j_username = "User name is required";
    }
    if (!password) {
      fieldErrors.j_password = "Password is required";
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError(fieldErrors);
    }

    const account = await verifyCredentials(username, password);
    if (!account) {
      throw createError({ status: 401, message: "Invalid user name or password" });
    }

    await startSession(event, account);

    if (remember) {
      setCookie(event, AUTH_CONFIG.rememberCookieName, account.username, {
        maxAge: AUTH_CONFIG.rememberCookieMaxAgeSeconds,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    } else {
      deleteCookie(event, AUTH_CONFIG.rememberCookieName, { path: "/" });
    }

    return { user: account };
  } catch (error) {
    throw toHttpError(error);
  }
});
