/**
 * POST /api/auth/register (design.md C12, D6, SD1/SD2): validates
 * j_username/j_password/j_password_confirm with lib/validation.ts (C3),
 * keyed by parameter name so the client can show each error under its own
 * field. Delegates account creation to createAccount (C6), which throws
 * DuplicateAccountError on a taken name, then starts a session (C8) on
 * success and answers 201 with the new account. Every error, including
 * this handler's own ValidationError, is routed through toHttpError (C2).
 */
import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { createAccount } from "../../../lib/accounts";
import { ValidationError, toHttpError } from "../../../lib/errors";
import { startSession } from "../../../lib/session";
import {
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from "../../../lib/validation";

interface RegisterBody {
  j_username?: unknown;
  j_password?: unknown;
  j_password_confirm?: unknown;
}

export default defineHandler(async (event) => {
  try {
    const body = await readBody<RegisterBody>(event);

    const username = typeof body?.j_username === "string" ? body.j_username : "";
    const password = typeof body?.j_password === "string" ? body.j_password : "";
    const passwordConfirm =
      typeof body?.j_password_confirm === "string" ? body.j_password_confirm : "";

    const fieldErrors: Record<string, string> = {};
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirmation(password, passwordConfirm);
    if (usernameError) {
      fieldErrors.j_username = usernameError;
    }
    if (passwordError) {
      fieldErrors.j_password = passwordError;
    }
    if (confirmError) {
      fieldErrors.j_password_confirm = confirmError;
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError(fieldErrors);
    }

    const account = await createAccount({ username, password });
    await startSession(event, account);

    setResponseStatus(event, 201);
    return { user: account };
  } catch (error) {
    throw toHttpError(error);
  }
});
