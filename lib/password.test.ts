import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

/**
 * UNIT TEST (server project)
 *
 * Covers hashPassword (argon2id, never equal to the plain text) and
 * verifyPassword (accepts the right password, rejects a wrong one).
 */
describe("hashPassword", () => {
  it("never returns the plain password as the hash (AC-3)", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
  });

  it("produces an argon2id hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it("produces a different hash for the same password across calls (random salt)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("accepts the right password against its own hash (AC-3)", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password (AC-3)", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
