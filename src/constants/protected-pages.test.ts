import { describe, expect, it } from "vitest";

import { PROTECTED_PAGE_PATHS } from "./protected-pages";

/** design.md D7: checkout requires a signed-in customer. */
describe("PROTECTED_PAGE_PATHS", () => {
  it("includes /checkout beside the profile pages", () => {
    expect([...PROTECTED_PAGE_PATHS]).toEqual(["/users/profile", "/users/create", "/checkout"]);
  });
});
