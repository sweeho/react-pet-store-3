/**
 * Protected API paths (design.md C10, D7, SD10) — the modern equivalent of
 * signon-config.xml, evaluated once at module load (in memory for the
 * process lifetime) instead of loaded from XML at filter init.
 */
export const PROTECTED_API_PATHS = Object.freeze(["/api/customers", "/api/customers/me"] as const);

const PROTECTED_API_PATH_SET = new Set<string>(PROTECTED_API_PATHS);

export function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PATH_SET.has(pathname);
}
