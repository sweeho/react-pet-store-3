import { H3Event, defineHandler } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

import {
  DuplicateAccountError,
  NotFoundError,
  ValidationError,
  toHttpError,
} from "../../lib/errors";

/**
 * INTEGRATION TEST
 *
 * Pins the serialized JSON error body a route handler actually sends, so
 * src/utils/api.ts (C4) has a fixed target: message, data.code and, for a
 * ValidationError, data.fieldErrors. Built the way hello.test.ts builds a
 * real H3Event and runs a real handler through it, no HTTP server involved.
 */
function makeEvent() {
  return new H3Event(new Request("http://localhost/api/errors-contract"));
}

function runAndCapture(handler: (event: H3Event) => unknown, event: H3Event) {
  try {
    handler(event);
    throw new Error("expected handler to throw");
  } catch (error) {
    return error;
  }
}

describe("route error contract (AC-4, AC-5)", () => {
  it("a ServiceError thrown by a service surfaces as message + data.code through a real handler", () => {
    const handler = defineHandler(() => {
      throw toHttpError(new DuplicateAccountError("account taken"));
    });

    const error = runAndCapture(handler, makeEvent()) as ReturnType<typeof toHttpError>;
    const body = error.toJSON();

    expect(error.status).toBe(409);
    expect(body.message).toBe("account taken");
    expect(body.data).toEqual({ code: "DUPLICATE_ACCOUNT" });
  });

  it("a ValidationError surfaces data.fieldErrors alongside data.code through a real handler", () => {
    const handler = defineHandler(() => {
      throw toHttpError(new ValidationError({ email: "Invalid email" }, "invalid input"));
    });

    const error = runAndCapture(handler, makeEvent()) as ReturnType<typeof toHttpError>;
    const body = error.toJSON();

    expect(error.status).toBe(422);
    expect(body.message).toBe("invalid input");
    expect(body.data).toEqual({
      code: "VALIDATION_FAILED",
      fieldErrors: { email: "Invalid email" },
    });
  });

  it("a NotFoundError surfaces as a 404 through a real handler", () => {
    const handler = defineHandler(() => {
      throw toHttpError(new NotFoundError("customer not found"));
    });

    const error = runAndCapture(handler, makeEvent()) as ReturnType<typeof toHttpError>;

    expect(error.status).toBe(404);
    expect(error.toJSON().data).toEqual({ code: "NOT_FOUND" });
  });

  it("an unexpected throw inside a route surfaces as a generic, non-leaking 500", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const handler = defineHandler(() => {
        try {
          throw new Error("connection string: postgres://secret");
        } catch (error) {
          throw toHttpError(error);
        }
      });

      const error = runAndCapture(handler, makeEvent()) as ReturnType<typeof toHttpError>;
      const serialized = JSON.stringify(error.toJSON());

      expect(error.status).toBe(500);
      expect(error.toJSON().message).toBe("Internal server error");
      expect(serialized).not.toContain("postgres://secret");
      expect(serialized).not.toContain("stack");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });
});
