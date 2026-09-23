---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0017
branch: vortex/feat/SWHR3-T-0017-11-account-storage-and-credential-servic-4a596ffa
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0017/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0017: Account storage and credential service

## What changed

Added the `accounts` table (design.md D8/C6) and its migration, `lib/password.ts` (argon2id hash/verify), and `lib/accounts.ts` (`createAccount`, `verifyCredentials`, `changePassword`) with validation via `lib/validation.ts` (C3) and duplicate-username detection via `DuplicateAccountError` (C2).

## Files

- `db/schema.ts` — new `accounts` table: `id`, unique `username`, `passwordHash`, `createdAt`.
- `db/client.ts` — registers `accounts` in the schema map passed to `drizzle()`.
- `drizzle/0001_dizzy_violations.sql` + `drizzle/meta/{0001_snapshot.json,_journal.json}` — generated migration (`bun run db:generate`).
- `lib/password.ts` — `hashPassword`/`verifyPassword` wrapping `Bun.password` with `algorithm: "argon2id"`.
- `lib/password.test.ts` — hash never equals plaintext, argon2id prefix, distinct hashes per call, verify right/wrong.
- `lib/accounts.ts` — `createAccount`, `verifyCredentials`, `changePassword`; `Account = { id, username }`.
- `lib/accounts.test.ts` — duplicate detection, validation, verify success/failure/unknown-user, change-password success/failure.

## AC coverage

- AC-1 (duplicate user name → `DuplicateAccountError`) — `lib/accounts.ts` catches the SQLite `SQLITE_CONSTRAINT_UNIQUE` error from the insert (not a pre-check select, so concurrent inserts stay safe per SD22) and throws `DuplicateAccountError`; `lib/accounts.test.ts › throws DuplicateAccountError on a duplicate user name`.
- AC-2 (interface contract: schema + migration, `lib/password.ts`, `lib/accounts.ts` shapes) — see Files; `Account` type matches `{ id: number; username: string }` exactly.
- AC-3 (hash never equals plaintext; verify accepts right, rejects wrong/unknown) — `lib/password.test.ts` (5 tests) and `lib/accounts.test.ts › stores a passwordHash…` / `› returns the account…` / `› returns null for a wrong password` / `› returns null for an unknown user name`.
- AC-4 (`createAccount` rejects rule-breaking username/password with `ValidationError`) — `lib/accounts.test.ts › rejects a user name…` / `› rejects a password…` / `› reports invalid fields by name in fieldErrors`, using the same `validateUsername`/`validatePassword` as C3 so the rules can't drift.
- AC-5 (`changePassword` wrong current password throws, hash unchanged) — `lib/accounts.test.ts › throws and leaves the stored hash unchanged on a wrong current password`, which re-reads the row and asserts the hash is byte-identical.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/password.test.ts lib/accounts.test.ts
Test Files  2 passed (2)
     Tests  16 passed (16)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  21 passed (21)
     Tests  135 passed (135)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 135 passed, 0 failed`.

## Notes

- `verifyCredentials` runs a dummy `verifyPassword` against a fixed pre-computed argon2id hash when the user name is unknown, so an unknown-user response takes the same shape of work as a wrong-password response (PLAN.md step 5).
- `changePassword` on an unknown `accountId` returns the same `ValidationError("Current password is incorrect")` as a wrong current password, rather than a distinct not-found error — consistent with not revealing account existence, and not required by any AC to differ.
- No design reference applies beyond context: `mockup-registration-error.html` (linked in `PLAN.md`) is the client-side screen that will surface `DuplicateAccountError`, owned by a later ticket wiring `/api/auth/register` — this ticket is the service layer only, with no route or UI.
