/**
 * Protected API paths (design.md C10, D7, SD10) — the modern equivalent of
 * signon-config.xml, evaluated once at module load (in memory for the
 * process lifetime) instead of loaded from XML at filter init.
 */
export const PROTECTED_API_PATHS = Object.freeze([
  "/api/customers",
  "/api/customers/me",
  "/api/orders",
] as const);

const PROTECTED_API_PATH_SET = new Set<string>(PROTECTED_API_PATHS);

export function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PATH_SET.has(pathname);
}

// design.md D4: a prefix, not an exact-match list, so a future admin route
// cannot be added unprotected.
export const ADMIN_API_PREFIX = "/api/admin/";

export function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith(ADMIN_API_PREFIX);
}

// design.md D1 (supplier-portal-and-inventory): a prefix, for the supplier
// role only. Store administrators are refused here too.
export const SUPPLIER_API_PREFIX = "/api/supplier/";

export function isSupplierApiPath(pathname: string): boolean {
  return pathname.startsWith(SUPPLIER_API_PREFIX);
}
