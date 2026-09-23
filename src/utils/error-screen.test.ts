import { describe, expect, it } from "vitest";

import { ApiError } from "./api";
import { getErrorScreen } from "./error-screen";

/**
 * UNIT TEST
 *
 * Covers the three mappings the interface contract names (design.md C16,
 * AC-6): a 401 ApiError to "signin", a 409 DUPLICATE_ACCOUNT ApiError to
 * the friendly message on the "error" screen, and everything else to
 * "error" with its own message.
 */
describe("getErrorScreen", () => {
  it("maps a 401 ApiError to the signin screen", () => {
    const error = new ApiError({ status: 401, message: "Authentication required" });

    expect(getErrorScreen(error)).toEqual({ screen: "signin", message: "Authentication required" });
  });

  it("maps a 409 DUPLICATE_ACCOUNT ApiError to the friendly message on the error screen", () => {
    const error = new ApiError({
      status: 409,
      message: "An account with this user name already exists",
      code: "DUPLICATE_ACCOUNT",
    });

    expect(getErrorScreen(error)).toEqual({
      screen: "error",
      message: "That user name is already taken",
    });
  });

  it("maps any other ApiError to the error screen with its own message", () => {
    const error = new ApiError({
      status: 500,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });

    expect(getErrorScreen(error)).toEqual({ screen: "error", message: "Internal server error" });
  });

  it("maps a plain Error to the error screen with its message", () => {
    const error = new Error("boom");

    expect(getErrorScreen(error)).toEqual({ screen: "error", message: "boom" });
  });

  it("maps a non-Error thrown value to the error screen with a generic message", () => {
    expect(getErrorScreen("just a string")).toEqual({
      screen: "error",
      message: "An unexpected error occurred",
    });
    expect(getErrorScreen(undefined)).toEqual({
      screen: "error",
      message: "An unexpected error occurred",
    });
  });
});
