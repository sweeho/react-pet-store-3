import { describe, expect, it, vi } from "vitest";

import {
  DuplicateAccountError,
  DuplicateEmailError,
  NotFoundError,
  ProfileExistsError,
  ServiceError,
  ServiceUnavailableError,
  ValidationError,
  toHttpError,
} from "./errors";

/**
 * UNIT TEST (server project)
 *
 * Covers every ServiceError subclass's status/code, ValidationError's
 * fieldErrors passthrough, the unknown-error 500 (no leaked message/stack,
 * one console.error call) and h3 error passthrough (design.md C2/D11).
 */
describe("ServiceError subclasses", () => {
  it("carries the code, message and status passed to the base class (AC-3)", () => {
    const error = new ServiceError("CUSTOM_CODE", "custom message", 418);

    expect(error.code).toBe("CUSTOM_CODE");
    expect(error.message).toBe("custom message");
    expect(error.status).toBe(418);
    expect(error).toBeInstanceOf(Error);
  });

  it("DuplicateAccountError is a 409 DUPLICATE_ACCOUNT (AC-3)", () => {
    const error = new DuplicateAccountError();
    expect(error.status).toBe(409);
    expect(error.code).toBe("DUPLICATE_ACCOUNT");
    expect(error).toBeInstanceOf(ServiceError);
  });

  it("DuplicateEmailError is a 409 DUPLICATE_EMAIL (AC-3)", () => {
    const error = new DuplicateEmailError();
    expect(error.status).toBe(409);
    expect(error.code).toBe("DUPLICATE_EMAIL");
  });

  it("ProfileExistsError is a 409 PROFILE_EXISTS (AC-3)", () => {
    const error = new ProfileExistsError();
    expect(error.status).toBe(409);
    expect(error.code).toBe("PROFILE_EXISTS");
  });

  it("NotFoundError is a 404 NOT_FOUND (AC-3)", () => {
    const error = new NotFoundError();
    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("ServiceUnavailableError is a 503 SERVICE_UNAVAILABLE (AC-3)", () => {
    const error = new ServiceUnavailableError();
    expect(error.status).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("ValidationError is a 422 VALIDATION_FAILED carrying fieldErrors (AC-3)", () => {
    const fieldErrors = { "address.street1": "Street is required" };
    const error = new ValidationError(fieldErrors);

    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors).toEqual(fieldErrors);
  });

  it("every subclass accepts a custom message", () => {
    expect(new DuplicateAccountError("taken").message).toBe("taken");
    expect(new NotFoundError("nope").message).toBe("nope");
    expect(new ValidationError({}, "bad input").message).toBe("bad input");
  });
});

describe("toHttpError", () => {
  it("maps a ServiceError to an h3 error carrying status, message and data.code (AC-4)", () => {
    const httpError = toHttpError(new DuplicateAccountError("dup"));

    expect(httpError.status).toBe(409);
    expect(httpError.message).toBe("dup");
    expect(httpError.data).toEqual({ code: "DUPLICATE_ACCOUNT" });
  });

  it("maps a ValidationError's fieldErrors into data.fieldErrors alongside data.code (AC-4)", () => {
    const fieldErrors = { username: "Required" };
    const httpError = toHttpError(new ValidationError(fieldErrors, "invalid"));

    expect(httpError.status).toBe(422);
    expect(httpError.data).toEqual({ code: "VALIDATION_FAILED", fieldErrors });
  });

  it("maps every other thrown value to a 500 that leaks neither message nor stack, and logs once (AC-5)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const secret = new Error("db password is hunter2");
      const httpError = toHttpError(secret);

      expect(httpError.status).toBe(500);
      expect(httpError.message).not.toContain("hunter2");
      expect(httpError.data).toEqual({ code: "INTERNAL_ERROR" });
      expect(JSON.stringify(httpError.toJSON())).not.toContain("hunter2");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(secret);
    } finally {
      spy.mockRestore();
    }
  });

  it("maps a thrown string/number/plain object to a safe 500 too (AC-5)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const httpError = toHttpError("raw string failure");
      expect(httpError.status).toBe(500);
      expect(httpError.message).toBe("Internal server error");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it("passes an existing h3 error through unchanged (AC-4)", () => {
    const original = toHttpError(new NotFoundError("missing"));
    const passedThrough = toHttpError(original);

    expect(passedThrough).toBe(original);
  });
});
