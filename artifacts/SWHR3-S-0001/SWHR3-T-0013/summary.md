---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0013
branch: vortex/feat/SWHR3-T-0013-7-customerprofile-json-shape-and-input-p-1edc80d6
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0013/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0013: CustomerProfile JSON shape and input parsing

## What changed

Added `lib/customer-profile.ts` (design.md D10, C14): `CustomerProfile`/`CustomerProfileInput` types, the `CARD_TYPES`/`LOCALES`/`FAVORITE_CATEGORIES` enums, `toCustomerProfile(account, customer, card)` (masks the stored card number to `cardNumberLast4`), and `parseCustomerProfileInput(body, mode)` (collects every field problem from an untrusted body before throwing one `ValidationError` keyed by dotted path). Mirrored the two types and three constants for the client in `src/types/customer-profile.ts` (D13).

## Files

- `lib/customer-profile.ts` — types, enums, `toCustomerProfile`, `parseCustomerProfileInput`.
- `lib/customer-profile.test.ts` — 11 tests: mapping, masking, required-field collection, email/card-type/locale field errors, create-vs-update card-number handling, client/server constant parity.
- `src/types/customer-profile.ts` — client mirror of the two types and three constants.
- `tsconfig.node.json` — added `src/types/customer-profile.ts` to `include` (see Notes; not in the ticket's file-ownership list, a minor documented deviation).

## AC coverage

- AC-1 (interface contract: `lib/customer-profile.ts` exports `CustomerProfile`, `CustomerProfileInput`, `CARD_TYPES`, `LOCALES`, `FAVORITE_CATEGORIES`, `toCustomerProfile`, `parseCustomerProfileInput`; `src/types/customer-profile.ts` mirrors the two types and three constants) — see Files; verified by `tsc --build` typing both the tests and the parity assertion against the real exports.
- AC-2 (`toCustomerProfile` never exposes the stored card number, only its last four digits) — `lib/customer-profile.test.ts › toCustomerProfile › never exposes the stored card number…` asserts `JSON.stringify(profile)` never contains the full card number.
- AC-3 (missing required field → `ValidationError.fieldErrors` names it by dotted path; `address.street2` optional) — `› throws ValidationError naming every missing required field…` (empty body, asserts the exact set of dotted paths) and `› treats address.street2 as optional…`.
- AC-4 (update mode: empty card number accepted, means keep card on file; create mode: field error) — `› rejects an empty card number in create mode…` and `› accepts an empty card number in update mode…`.
- AC-5 (invalid email / card type outside `CARD_TYPES` / locale outside `LOCALES` → field error) — `› rejects an invalid email…`, `› rejects a card type outside CARD_TYPES…`, `› rejects a locale outside LOCALES…`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/customer-profile.test.ts
Test Files  1 passed (1)
     Tests  11 passed (11)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  24 passed (24)
     Tests  155 passed (155)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 155 passed, 0 failed`. Red phase confirmed separately by stubbing both functions to throw before restoring the real implementation (see `tdd-test-result.md` "Red run").

## Notes

- **Deviation:** added `src/types/customer-profile.ts` to `tsconfig.node.json`'s `include` array (one line). Without it `tsc --build` refuses the parity test's cross-import with TS6307. This mirrors the exact precedent SWHR3-T-0020 set for `src/constants/auth.ts`; no other ticket in this sprint phase touches `tsconfig.node.json`, so it carries no ownership conflict. Recorded on `PLAN.md` per the minor-deviation protocol.
- No design screen applies beyond field shape: `mockup-create-customer.html` and `mockup-account-profile.html` (named in `PLAN.md`) confirm the field names/labels (`street1`/`street2` optional, card fields required, `favoriteCategory` as a "Select a category" dropdown) this module's shape and required-field set were built to match; this ticket has no route or UI ownership, so no screen was rendered.
- Numeric field parsing (`card.expiryMonth`/`card.expiryYear`) accepts both `number` and numeric-`string` bodies (a form `<select>` may serialize either way over JSON) and rejects non-integers/out-of-range values with the same dotted-path field-error shape as the string fields.
- Card-type/locale/favorite-category casts (`as CardType`/`as Locale`/`as FavoriteCategory | null`) in `toCustomerProfile` are safe because the only writer of those columns is `parseCustomerProfileInput`, which already checked them against the enums — commented at each cast site.
