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

export class CatalogItemNotFoundError extends ServiceError {
  constructor(itemId: string) {
    super("CATALOG_ITEM_NOT_FOUND", `Catalog item ${itemId} not found`, 404);
    this.name = "CatalogItemNotFoundError";
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

// design.md C5/D9: a checkout form with required fields missing. The list
// keeps submission order and reaches the client beside fieldErrors.
export class MissingFormDataError extends ValidationError {
  readonly missingFields: string[];

  constructor(fieldErrors: Record<string, string>, missingFields: string[]) {
    super(fieldErrors);
    this.name = "MissingFormDataError";
    this.missingFields = missingFields;
  }
}

// design.md C5/D9: checkout attempted with an empty cart.
export class ShoppingCartEmptyError extends ServiceError {
  constructor() {
    super("SHOPPING_CART_EMPTY", "Shopping cart is empty", 409);
    this.name = "ShoppingCartEmptyError";
  }
}

export class ServiceUnavailableError extends ServiceError {
  constructor(message = "Service unavailable") {
    super("SERVICE_UNAVAILABLE", message, 503);
    this.name = "ServiceUnavailableError";
  }
}

// design.md D2/C7: thrown by lib/order-status.ts's assertTransition for any
// pair other than PENDING -> APPROVED / PENDING -> DENIED.
export class InvalidTransitionError extends ServiceError {
  constructor(orderId: number, status: string) {
    super("INVALID_TRANSITION", `Order ${orderId} is ${status} and cannot be transitioned`, 409);
    this.name = "InvalidTransitionError";
  }
}

// design.md D4/C7: thrown by an admin route when the signed-in account's
// role is not "admin".
export class ForbiddenError extends ServiceError {
  constructor(message = "Administrator credentials required") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

function errorData(error: ServiceError): Record<string, unknown> {
  if (error instanceof MissingFormDataError) {
    return {
      code: error.code,
      fieldErrors: error.fieldErrors,
      missingFields: error.missingFields,
    };
  }
  if (error instanceof ValidationError) {
    return { code: error.code, fieldErrors: error.fieldErrors };
  }
  return { code: error.code };
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
      data: errorData(error),
    });
  }

  console.error(error);
  return createError({
    status: 500,
    message: "Internal server error",
    data: { code: "INTERNAL_ERROR" },
  });
}
