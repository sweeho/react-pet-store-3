import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AUTH_CONFIG, getSessionSecret } from "./auth-config";
import { PASSWORD_RULES, REMEMBER_COOKIE_NAME, USERNAME_RULES } from "../src/constants/auth";

/**
 * UNIT TEST (server project)
 *
 * Exercises pure configuration values and getSessionSecret's env-driven
 * branches. Copy this pattern for other lib/ modules that read process.env.
 */
describe("AUTH_CONFIG", () => {
  it("configures form-based auth with the sign-in and error pages (AC-1, AC-2)", () => {
    expect(AUTH_CONFIG.authMethod).toBe("FORM");
    expect(AUTH_CONFIG.signInPage).toBe("/signin");
    expect(AUTH_CONFIG.signInErrorPage).toBe("/signin");
  });

  it("configures the session cookie, timeout, remember cookie and locale (AC-2)", () => {
    expect(AUTH_CONFIG.sessionCookieName).toBe("petstore_session");
    expect(AUTH_CONFIG.sessionTimeoutSeconds).toBe(1800);
    expect(AUTH_CONFIG.rememberCookieName).toBe("bp_signon");
    expect(AUTH_CONFIG.rememberCookieMaxAgeSeconds).toBe(60 * 60 * 24 * 365);
    expect(AUTH_CONFIG.defaultLocale).toBe("en_US");
  });

  it("configures username and password length and pattern rules (AC-2)", () => {
    expect(AUTH_CONFIG.username).toEqual({
      minLength: 3,
      maxLength: 25,
      pattern: /^[A-Za-z0-9]+$/,
    });
    expect(AUTH_CONFIG.password).toEqual({ minLength: 8, maxLength: 64 });
  });

  it("mirrors the client-safe values in src/constants/auth.ts (AC-2)", () => {
    expect(USERNAME_RULES.minLength).toBe(AUTH_CONFIG.username.minLength);
    expect(USERNAME_RULES.maxLength).toBe(AUTH_CONFIG.username.maxLength);
    expect(USERNAME_RULES.pattern).toBe(AUTH_CONFIG.username.pattern.source);
    expect(PASSWORD_RULES.minLength).toBe(AUTH_CONFIG.password.minLength);
    expect(PASSWORD_RULES.maxLength).toBe(AUTH_CONFIG.password.maxLength);
    expect(REMEMBER_COOKIE_NAME).toBe(AUTH_CONFIG.rememberCookieName);
  });
});

describe("getSessionSecret", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.SESSION_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns SESSION_SECRET when it is set (AC-3)", () => {
    process.env.SESSION_SECRET = "a-secret-from-the-environment";

    expect(getSessionSecret()).toBe("a-secret-from-the-environment");
  });

  it("returns a fixed development secret of at least 32 characters outside production (AC-3)", () => {
    process.env.NODE_ENV = "test";

    const secret = getSessionSecret();

    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(getSessionSecret()).toBe(secret);
  });

  it("throws in production when SESSION_SECRET is unset (AC-3)", () => {
    process.env.NODE_ENV = "production";

    expect(() => getSessionSecret()).toThrow();
  });
});
