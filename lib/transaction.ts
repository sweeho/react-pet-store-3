/**
 * Transaction helper for multi-row writes (design.md D12, interface
 * contract C7). Drizzle's bun-sqlite transactions are synchronous.
 * `withTransaction` starts and commits/rolls back its own transaction for a
 * standalone call; given an `outer` transaction (already inside a
 * `withTransaction` call further up the stack) it just runs `fn` against
 * that transaction instead of starting a second one — the `Required`
 * semantics from the legacy CMT model (SD14).
 */
import { db } from "../db/client";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DbOrTx = typeof db | Tx;

export function withTransaction<T>(fn: (tx: DbOrTx) => T, outer?: DbOrTx): T {
  if (outer) {
    return fn(outer);
  }
  return db.transaction(fn);
}
