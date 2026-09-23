import { describe, expect, it } from "vitest";

import { PROTECTED_API_PATHS, isProtectedApiPath } from "./protected-resources";

/**
 * UNIT TEST (server project)
 *
 * Covers the exact-match contract of C10: /api/customers and
 * /api/customers/me are protected; a prefix, a sibling and /api/hello are
 * not (AC-1, AC-2 — pattern loaded/cached in memory and matched exactly).
 */
describe("PROTECTED_API_PATHS / isProtectedApiPath", () => {
  it("lists exactly /api/customers and /api/customers/me", () => {
    expect(PROTECTED_API_PATHS).toEqual(["/api/customers", "/api/customers/me"]);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(PROTECTED_API_PATHS)).toBe(true);
  });

  it("matches a protected path exactly", () => {
    expect(isProtectedApiPath("/api/customers")).toBe(true);
    expect(isProtectedApiPath("/api/customers/me")).toBe(true);
  });

  it("does not match a path that merely starts with a protected prefix", () => {
    expect(isProtectedApiPath("/api/customers/123")).toBe(false);
    expect(isProtectedApiPath("/api/customers/me/extra")).toBe(false);
  });

  it("does not match an unrelated or unprotected path", () => {
    expect(isProtectedApiPath("/api/hello")).toBe(false);
    expect(isProtectedApiPath("/api/users")).toBe(false);
    expect(isProtectedApiPath("/")).toBe(false);
  });
});
