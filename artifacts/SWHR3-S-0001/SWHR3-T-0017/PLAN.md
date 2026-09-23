# PLAN — SWHR3-T-0017: Account storage and credential service

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 11. SignOn Component Integration (every checkbox in it is tagged `(SWHR3-T-0017)`)
- **Requirements:** New user registration and duplicate detection (duplicate username)
- **Depends on:** SWHR3-T-0021 (lib/validation.ts; transitively lib/errors.ts, lib/auth-config.ts)

## Objective

Store accounts with argon2id password hashes and provide create, verify and change-password operations with duplicate detection.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-registration-error.html` (the duplicate case this service reports)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Add `accounts` to `db/schema.ts` (C6): `id` integer primary key autoincrement, `username` text not null unique, `passwordHash` text not null, `createdAt` integer timestamp default now. Register it in `db/client.ts`'s schema map. Generate and commit the migration.
1. Create `lib/password.ts` with `hashPassword` (`Bun.password.hash`, argon2id) and `verifyPassword` (`Bun.password.verify`).
1. Create `lib/accounts.ts`.
1. `createAccount` validates the user name and password with `lib/validation.ts` (C3), throwing `ValidationError`, then inserts. A unique-constraint failure becomes `DuplicateAccountError` (SD6); check for the constraint error, not by selecting first, so concurrent inserts are safe.
1. `verifyCredentials` returns `{ id, username }` or `null`. Run a dummy `verifyPassword` for unknown user names so the response time does not reveal which user names exist.
1. `changePassword` verifies the current password, throws `ValidationError` on a mismatch, and stores the new hash.
1. Tests: `lib/accounts.test.ts` and `lib/password.test.ts` cover the hash not being the plain text, verify right and wrong, the unknown user, a duplicate raising `DuplicateAccountError`, invalid input, and change-password success and failure.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `db/schema.ts` (accounts)
- `db/client.ts` (schema map)
- `drizzle/` (new migration + meta)
- `lib/password.ts`
- `lib/password.test.ts`
- `lib/accounts.ts`
- `lib/accounts.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
