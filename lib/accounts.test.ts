import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts } from "../db/schema";
import { changePassword, createAccount, verifyCredentials } from "./accounts";
import { DuplicateAccountError, ValidationError } from "./errors";

/**
 * UNIT TEST (server project)
 *
 * Exercises createAccount / verifyCredentials / changePassword against the
 * real in-memory db (VITEST=true swaps sqlite.db for :memory:, see
 * db/client.ts), the same pattern routes/api/users tests use. Each test
 * picks its own username so tests in this file never collide.
 */
describe("createAccount", () => {
  it("stores a passwordHash that never equals the plain password (AC-3)", async () => {
    const account = await createAccount({ username: "alice1", password: "correct-horse-1" });

    const row = db.select().from(accounts).where(eqUsername("alice1")).get();
    expect(row?.passwordHash).not.toBe("correct-horse-1");
    expect(account).toEqual({ id: account.id, username: "alice1" });
  });

  it("rejects a user name that breaks the auth-config rules with ValidationError (AC-4)", async () => {
    await expect(
      createAccount({ username: "ab", password: "correct-horse-1" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a password that breaks the auth-config rules with ValidationError (AC-4)", async () => {
    await expect(createAccount({ username: "alice2", password: "short" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("reports invalid fields by name in fieldErrors", async () => {
    try {
      await createAccount({ username: "ab", password: "short" });
      expect.fail("expected createAccount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(Object.keys(validationError.fieldErrors).sort()).toEqual(["password", "username"]);
    }
  });

  it("throws DuplicateAccountError on a duplicate user name (AC-1)", async () => {
    await createAccount({ username: "bob1", password: "correct-horse-1" });

    await expect(
      createAccount({ username: "bob1", password: "another-pass-1" }),
    ).rejects.toBeInstanceOf(DuplicateAccountError);
  });
});

describe("verifyCredentials", () => {
  it("returns the account for the right password (AC-3)", async () => {
    await createAccount({ username: "carol1", password: "correct-horse-1" });

    await expect(verifyCredentials("carol1", "correct-horse-1")).resolves.toEqual({
      id: expect.any(Number),
      username: "carol1",
    });
  });

  it("returns null for a wrong password (AC-3)", async () => {
    await createAccount({ username: "dave1", password: "correct-horse-1" });

    await expect(verifyCredentials("dave1", "wrong-password-1")).resolves.toBeNull();
  });

  it("returns null for an unknown user name (AC-3)", async () => {
    await expect(verifyCredentials("nobody-here", "whatever-1")).resolves.toBeNull();
  });
});

describe("changePassword", () => {
  it("updates the stored hash on a correct current password", async () => {
    const account = await createAccount({ username: "erin1", password: "old-password-1" });

    await changePassword(account.id, "old-password-1", "new-password-1");

    await expect(verifyCredentials("erin1", "new-password-1")).resolves.toEqual({
      id: account.id,
      username: "erin1",
    });
  });

  it("throws and leaves the stored hash unchanged on a wrong current password (AC-5)", async () => {
    const account = await createAccount({ username: "frank1", password: "old-password-1" });
    const before = db.select().from(accounts).where(eqUsername("frank1")).get();

    await expect(
      changePassword(account.id, "wrong-current-1", "new-password-1"),
    ).rejects.toBeInstanceOf(ValidationError);

    const after = db.select().from(accounts).where(eqUsername("frank1")).get();
    expect(after?.passwordHash).toBe(before?.passwordHash);
    await expect(verifyCredentials("frank1", "old-password-1")).resolves.toEqual({
      id: account.id,
      username: "frank1",
    });
  });

  it("rejects a new password that breaks the auth-config rules", async () => {
    const account = await createAccount({ username: "grace1", password: "old-password-1" });

    await expect(changePassword(account.id, "old-password-1", "short")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

function eqUsername(username: string) {
  return eq(accounts.username, username);
}
