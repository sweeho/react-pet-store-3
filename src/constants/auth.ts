/**
 * Client-safe mirror of lib/auth-config.ts (design.md D13). The client
 * cannot import from lib/ (the tsconfig split), so the values both sides
 * need are re-declared here; lib/auth-config.test.ts pins parity.
 */
export const SIGN_IN_PATH = "/signin";
export const CREATE_ACCOUNT_PATH = "/users/create";
export const PROFILE_PATH = "/users/profile";

export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 25,
  pattern: "^[A-Za-z0-9]+$",
} as const;

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 64,
} as const;

export const REMEMBER_COOKIE_NAME = "bp_signon";
