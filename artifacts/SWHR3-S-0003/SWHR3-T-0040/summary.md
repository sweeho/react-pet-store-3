---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0040
branch: vortex/feat/SWHR3-T-0040-business-delegate-implementation-updateo-84a5c3fe
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0040/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0040: Business Delegate Implementation — updateOrders batch service

## What changed

Added `lib/order-approval.ts` (C4): `ChangedOrder`, `OrderApproval` and `updateOrders(approval)`,
which runs every change through `updateOrderStatus` (C3) inside one `withTransaction` (D6) and
logs one line per successful commit, without the actor (D7).

## Files

- `lib/order-approval.ts` — new: the types and `updateOrders`.
- `lib/order-approval.test.ts` — new: unit tests against the in-memory db.

## AC coverage

- AC-1 (atomic rollback) — a failing change throws out of the `withTransaction` callback before
  any commit; covered by `rolls back the whole batch when one order is no longer PENDING` and
  `[SWHR3-C-0016]`.
- AC-2 (contract C4) — `updateOrders` returns `{ updated: approval.changes.length }`; covered by
  `[SWHR3-C-0013]`.
- AC-3 (typed errors propagate, other orders unchanged) — `updateOrderStatus`'s `NotFoundError` /
  `InvalidTransitionError` are not caught; covered by `[SWHR3-C-0016]` and the non-PENDING test,
  both of which assert the untouched orders' `status` and `updatedAt`.
- AC-4 (one log line, no actor) — `console.info` call after the transaction commits; covered by
  the two log-line tests (success writes exactly one line matching the format, failure writes
  none).

## Verification

```
$ bun run test -- lib/order-approval.test.ts   # red, stub throws VortexNotImplemented
Test Files  1 failed (1)
     Tests  5 failed (5)

$ bun run test -- lib/order-approval.test.ts   # green, after implementing updateOrders
Test Files  1 passed (1)
     Tests  5 passed (5)

$ bun run verify                                # full gate: lint + typecheck + full suite
Test Files  52 passed (52)
     Tests  314 passed (314)
```

See `tdd-test-result.md` — `TDD-RESULT: 314 passed, 0 failed`.

`bun run verify:full` was attempted but this container has no Chromium installed; the E2E tier
was not run here (unrelated to this ticket, which touches no route or UI) and is covered in
Validation's browser-equipped container.

## Notes

`design.md` D6/C8 describes `withTransaction` taking a `{ behavior: "immediate" }` option; the
current `lib/transaction.ts` (outside this ticket's file ownership) does not yet accept one, so
`updateOrders` calls it with just the callback. This is a minor deviation, not a contract change:
SQLite transactions are atomic regardless of `behavior`, so this ticket's rollback ACs hold under
the default (deferred) mode — only concurrent-writer lock timing differs, which is not part of
this ticket's acceptance criteria.
