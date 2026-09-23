/**
 * Typed service errors and the route-level HTTP error mapping (design.md
 * D11, interface contract C2).
 *
 * Every service in lib/ is a plain ES module imported statically by the
 * routes that call it (design.md SD3/SD4) — there is no ServiceLocator/JNDI
 * runtime lookup that can fail, so the only failure modes a route has to
 * convert are the typed errors a service throws and anything unexpected.
 * A route catches what a service throws and converts it with toHttpError
 * before rethrowing, so the HTTP response never carries more than a typed
 * ServiceError intends, or the internals of an unexpected failure.
 */
import { createError, isError } from "nitro/h3";
import type { HTTPError } from "nitro/h3";

export class ServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.status = status;
  }
}

export class DuplicateAccountError extends ServiceError {
  constructor(message = "An account with this user name already exists") {
    super("DUPLICATE_ACCOUNT", message, 409);
    this.name = "DuplicateAccountError";
  }
}

export class DuplicateEmailError extends ServiceError {
  constructor(message = "An account with this email already exists") {
    super("DUPLICATE_EMAIL", message, 409);
    this.name = "DuplicateEmailError";
  }
}

export class ProfileExistsError extends ServiceError {
  constructor(message = "A profile already exists for this account") {
    super("PROFILE_EXISTS", message, 409);
    this.name = "ProfileExistsError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>, message = "Validation failed") {
    super("VALIDATION_FAILED", message, 422);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ServiceUnavailableError extends ServiceError {
  constructor(message = "Service unavailable") {
    super("SERVICE_UNAVAILABLE", message, 503);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Converts any thrown value into a safe h3 HTTP error. A ServiceError maps
 * to its own status/code (plus fieldErrors for a ValidationError); an
 * existing h3 error passes through unchanged; anything else is logged once
 * and replaced with a generic 500 — the original message and stack never
 * reach the response.
 */
export function toHttpError(error: unknown): HTTPError {
  if (isError(error)) {
    return error;
  }

  if (error instanceof ServiceError) {
    return createError({
      status: error.status,
      message: error.message,
      data:
        error instanceof ValidationError
          ? { code: error.code, fieldErrors: error.fieldErrors }
          : { code: error.code },
    });
  }

  console.error(error);
  return createError({
    status: 500,
    message: "Internal server error",
    data: { code: "INTERNAL_ERROR" },
  });
}
