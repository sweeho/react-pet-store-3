/**
 * Central authentication configuration — the equivalent of web.xml's
 * login-config and session-config in the legacy system (design.md D3/D5/D6,
 * SD11). One module, one source of truth; src/constants/auth.ts mirrors the
 * client-safe subset because the client cannot import from lib/ (D13).
 */
export const AUTH_CONFIG = {
  authMethod: "FORM",
  signInPage: "/signin",
  signInErrorPage: "/signin",
  sessionCookieName: "petstore_session",
  sessionTimeoutSeconds: 1800,
  rememberCookieName: "bp_signon",
  rememberCookieMaxAgeSeconds: 60 * 60 * 24 * 365,
  defaultLocale: "en_US",
  username: {
    minLength: 3,
    maxLength: 25,
    pattern: /^[A-Za-z0-9]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 64,
  },
} as const;

// Used only outside production (dev, test, CI) so those environments need no
// setup (D3). At least 32 characters, matching h3's SessionConfig.password
// minimum.
const DEVELOPMENT_SESSION_SECRET = "development-only-session-secret-not-for-production-use";

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return DEVELOPMENT_SESSION_SECRET;
}
