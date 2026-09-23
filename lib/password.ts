/**
 * Password hashing (design.md D4, interface contract C6). Bun.password
 * defaults to bcrypt; argon2id is requested explicitly. No new dependency —
 * db/client.ts already forces the Bun runtime everywhere this module runs.
 */
export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "argon2id" });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
