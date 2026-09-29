---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0044
branch: vortex/feat/SWHR3-T-0044-ejb-transaction-management-immediate-mod-9c1e63a3
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0044/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0044: EJB Transaction Management — immediate-mode transactions and batch atomicity

## What changed

`withTransaction` gained an optional third `options: { behavior }` argument (existing 1-/2-arg call
sites unchanged), `updateOrders` now runs its batch under `{ behavior: "immediate" }` (design.md
D6), and a dedicated atomicity suite proves the three scenarios this ticket's AC names. No UI: this
ticket touches nothing a user sees (PLAN.md).

## Files

- `lib/transaction.ts` — added `TransactionOptions` and the third `options` parameter, passed through to `db.transaction` only for a standalone call. Per C8.
- `lib/transaction.test.ts` — 5 new cases for the option (each behavior value, immediate-mode rollback, ignored when joining an outer tx); the 4 existing cases are untouched.
- `lib/order-approval.ts` — `updateOrders` now passes `{ behavior: "immediate" }`; updated its header comment, which had explicitly documented the prior deferred-mode limitation. No other logic changed.
- `lib/order-approval.atomicity.test.ts` (new) — the three linked cases.

## AC coverage

- AC-1 (multiple orders updated within a single transaction context) — `lib/order-approval.ts`'s `updateOrders`, covered by `order-approval.atomicity.test.ts › [SWHR3-C-0021]`.
- AC-2 (partial batch failure rolls back all three, nothing partially persisted) — same, covered by `› [SWHR3-C-0022]`.
- AC-3 / Contract C8 (`withTransaction` accepts `behavior`; calls without it behave exactly as before; existing tests unchanged) — `lib/transaction.ts`, covered by `transaction.test.ts`'s new cases plus its 4 pre-existing cases passing unmodified.
- AC-4 (two sequential batches on the same order: first wins, second fails `INVALID_TRANSITION`, its other change doesn't persist) — `order-approval.atomicity.test.ts › [SWHR3-C-0023]`.

## Verification

```
$ bun run typecheck   # before the lib/transaction.ts change — genuine red (TS2305, TS2554 x3)
$ bun run verify
Test Files  62 passed (62)
     Tests  388 passed (388)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is not installed in this
container and directs engineer containers to `bun run verify` instead (E2E runs in the QA-phase/CI
containers). This ticket adds no UI and no E2E spec, so nothing was skipped. Full detail and the
red→green proof: `tdd-test-result.md`.

## Notes

- The three linked atomicity cases (`SWHR3-C-0021/0022/0023`) already passed against the
  **unmodified** code — batch rollback-on-throw is ordinary SQLite transaction behavior that
  `updateOrders` already had (also proven independently by the pre-existing
  `order-approval.test.ts › [SWHR3-C-0016]`, from SWHR3-T-0040). This ticket's actual change —
  immediate vs. deferred write-lock timing — is not observable by a single synchronous in-process
  `bun:sqlite` connection, so a genuine red was not obtainable for those three; `tdd-test-result.md`
  records the real baseline run and explains why, per the artifact skill's guidance for a
  defensibly-unobtainable red. Genuine red **was** obtained and is recorded for the actual new
  surface, `lib/transaction.ts`'s `options` parameter, via `bun run typecheck`.
- `a2a_run_tests` refused to record the three platform-linked cases: this project's
  `.vortex/config.yaml` has no `testEvidence` block, so it directed use of the `TDD-RESULT` marker
  instead — `tdd-test-result.md` carries both.
