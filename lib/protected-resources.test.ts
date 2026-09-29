import { describe, expect, it } from "vitest";

import {
  ADMIN_API_PREFIX,
  PROTECTED_API_PATHS,
  SUPPLIER_API_PREFIX,
  isAdminApiPath,
  isProtectedApiPath,
  isSupplierApiPath,
} from "./protected-resources";

/**
 * UNIT TEST (server project)
 *
 * Covers the exact-match contract of C10: /api/customers and
 * /api/customers/me are protected; a prefix, a sibling and /api/hello are
 * not (AC-1, AC-2 — pattern loaded/cached in memory and matched exactly).
 */
describe("PROTECTED_API_PATHS / isProtectedApiPath", () => {
  it("lists exactly /api/customers, /api/customers/me and /api/orders", () => {
    expect(PROTECTED_API_PATHS).toEqual(["/api/customers", "/api/customers/me", "/api/orders"]);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(PROTECTED_API_PATHS)).toBe(true);
  });

  it("matches a protected path exactly", () => {
    expect(isProtectedApiPath("/api/customers")).toBe(true);
    expect(isProtectedApiPath("/api/customers/me")).toBe(true);
    expect(isProtectedApiPath("/api/orders")).toBe(true);
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

describe("ADMIN_API_PREFIX / isAdminApiPath", () => {
  it('is "/api/admin/"', () => {
    expect(ADMIN_API_PREFIX).toBe("/api/admin/");
  });

  it("matches any path under the admin prefix", () => {
    expect(isAdminApiPath("/api/admin/orders")).toBe(true);
    expect(isAdminApiPath("/api/admin/orders/status")).toBe(true);
    expect(isAdminApiPath("/api/admin/anything")).toBe(true);
  });

  it("does not match the bare prefix without a trailing path, or an unrelated path", () => {
    expect(isAdminApiPath("/api/admin")).toBe(false);
    expect(isAdminApiPath("/api/customers")).toBe(false);
    expect(isAdminApiPath("/api/hello")).toBe(false);
    expect(isAdminApiPath("/")).toBe(false);
  });
});

describe("SUPPLIER_API_PREFIX / isSupplierApiPath", () => {
  it('is "/api/supplier/"', () => {
    expect(SUPPLIER_API_PREFIX).toBe("/api/supplier/");
  });

  it("matches any path under the supplier prefix", () => {
    expect(isSupplierApiPath("/api/supplier/inventory")).toBe(true);
    expect(isSupplierApiPath("/api/supplier/orders/1")).toBe(true);
  });

  it("does not match the bare prefix, the admin prefix or an unrelated path", () => {
    expect(isSupplierApiPath("/api/supplier")).toBe(false);
    expect(isSupplierApiPath("/api/admin/orders")).toBe(false);
    expect(isSupplierApiPath("/api/hello")).toBe(false);
  });
});
