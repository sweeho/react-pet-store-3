/**
 * Protected page paths (design.md C10, D7): a signed-out visit to one of
 * these redirects to /signin?redirect=<path>. Client-side mirror of
 * lib/protected-resources.ts's PROTECTED_API_PATHS shape — the client
 * cannot import from lib/ (D13).
 */
export const PROTECTED_PAGE_PATHS = Object.freeze(["/users/profile", "/users/create"] as const);
