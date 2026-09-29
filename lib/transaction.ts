/**
 * Transaction helper for multi-row writes (design.md D12, interface
 * contract C7/C8). Drizzle's bun-sqlite transactions are synchronous.
 * `withTransaction` starts and commits/rolls back its own transaction for a
 * standalone call; given an `outer` transaction (already inside a
 * `withTransaction` call further up the stack) it just runs `fn` against
 * that transaction instead of starting a second one — the `Required`
 * semantics from the legacy CMT model (SD14). `options.behavior` (C8) only
 * applies to a standalone call: an `outer` call always joins the existing
 * transaction, which already fixed its own behavior when it started.
 */
import { db } from "../db/client";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DbOrTx = typeof db | Tx;

export type TransactionOptions = { behavior?: "deferred" | "immediate" | "exclusive" };

export function withTransaction<T>(
  fn: (tx: DbOrTx) => T,
  outer?: DbOrTx,
  options?: TransactionOptions,
): T {
  if (outer) {
    return fn(outer);
  }
  return db.transaction(fn, options);
}
