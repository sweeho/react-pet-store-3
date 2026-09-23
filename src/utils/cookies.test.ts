import { afterEach, describe, expect, it } from "vitest";

import { readCookie } from "./cookies";

/**
 * UNIT TEST (client project, jsdom)
 *
 * jsdom implements document.cookie as a real cookie jar, so this sets it
 * directly rather than mocking.
 */
function clearAllCookies() {
  for (const entry of document.cookie.split("; ")) {
    const name = entry.split("=")[0];
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

describe("readCookie", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("returns undefined when the cookie is not set", () => {
    expect(readCookie("bp_signon")).toBeUndefined();
  });

  it("returns the value of a cookie that is set", () => {
    document.cookie = "bp_signon=jgarrett";

    expect(readCookie("bp_signon")).toBe("jgarrett");
  });

  it("decodes a URI-encoded value", () => {
    document.cookie = `bp_signon=${encodeURIComponent("j garrett")}`;

    expect(readCookie("bp_signon")).toBe("j garrett");
  });

  it("picks the right cookie among several", () => {
    document.cookie = "other=1";
    document.cookie = "bp_signon=jgarrett";
    document.cookie = "another=2";

    expect(readCookie("bp_signon")).toBe("jgarrett");
  });
});
