/**
 * Account storage and credential operations (design.md D8, interface
 * contract C6). A unique-constraint violation on accounts.username becomes
 * DuplicateAccountError (SD6), detected from the thrown constraint error
 * rather than a pre-check select, so concurrent inserts race safely
 * (SQLite serialises writers; the unique index decides — SD22).
 */
import { eq } from "drizzle-orm";

import { hashPassword, verifyPassword } from "./password";
import { validatePassword, validateUsername } from "./validation";
import { db } from "../db/client";
import { accounts } from "../db/schema";
import { DuplicateAccountError, ValidationError } from "./errors";

export type Account = { id: number; username: string };

// A fixed argon2id hash of an unguessed password. verifyCredentials always
// runs a verify call, even for an unknown user name, so the response time
// does not reveal which user names exist (PLAN.md step 5).
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=2,p=1$18dgq321rn0gQ26KmlXf1xHjMTC+XkhhGtk2Dviubco$6U6ck+J3QhhcaQicYevKhODXUJ/JIwJtWeEzMpIAOO4";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

function validateCredentialsInput(username: string, password: string): void {
  const fieldErrors: Record<string, string> = {};
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);
  if (usernameError) {
    fieldErrors.username = usernameError;
  }
  if (passwordError) {
    fieldErrors.password = passwordError;
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError(fieldErrors);
  }
}

export async function createAccount(input: {
  username: string;
  password: string;
}): Promise<Account> {
  validateCredentialsInput(input.username, input.password);

  const passwordHash = await hashPassword(input.password);

  try {
    return db
      .insert(accounts)
      .values({ username: input.username, passwordHash })
      .returning({ id: accounts.id, username: accounts.username })
      .get();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DuplicateAccountError();
    }
    throw error;
  }
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<Account | null> {
  const account = db.select().from(accounts).where(eq(accounts.username, username)).get();

  if (!account) {
    await verifyPassword(password, DUMMY_HASH);
    return null;
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return null;
  }

  return { id: account.id, username: account.username };
}

export async function changePassword(
  accountId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) {
    throw new ValidationError({ currentPassword: "Current password is incorrect" });
  }

  const valid = await verifyPassword(currentPassword, account.passwordHash);
  if (!valid) {
    throw new ValidationError({ currentPassword: "Current password is incorrect" });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    throw new ValidationError({ password: passwordError });
  }

  const passwordHash = await hashPassword(newPassword);
  db.update(accounts).set({ passwordHash }).where(eq(accounts.id, accountId)).run();
}
