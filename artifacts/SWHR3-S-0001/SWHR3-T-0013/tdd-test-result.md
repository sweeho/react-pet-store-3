---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0013
branch: vortex/feat/SWHR3-T-0013-7-customerprofile-json-shape-and-input-p-1edc80d6
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0013/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0013

## Test cases

| Test                                                                                                            | Covers | Intent                                                               |
| --------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `lib/customer-profile.test.ts › toCustomerProfile › never exposes the stored card number…`                      | AC-2   | response only ever carries `cardNumberLast4`, never the full number  |
| `lib/customer-profile.test.ts › toCustomerProfile › maps account, customer and card rows onto the shape`        | AC-1   | full field-by-field mapping onto `CustomerProfile`                   |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › returns a typed input for a complete create body`   | AC-1   | happy path parses to `CustomerProfileInput`                          |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › treats address.street2 as optional…`                | AC-3   | missing `street2` → `null`, no field error                           |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › throws ValidationError naming every missing field…` | AC-3   | empty body → every required field reported by dotted path            |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › rejects an invalid email…`                          | AC-5   | non-address email → field error on `email`                           |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › rejects a card type outside CARD_TYPES…`            | AC-5   | field error on `card.cardType`                                       |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › rejects a locale outside LOCALES…`                  | AC-5   | field error on `preferences.locale`                                  |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › rejects an empty card number in create mode…`       | AC-4   | empty `card.cardNumber` is a field error in `create` mode            |
| `lib/customer-profile.test.ts › parseCustomerProfileInput › accepts an empty card number in update mode…`       | AC-4   | empty `card.cardNumber` means keep the card on file in `update` mode |
| `lib/customer-profile.test.ts › client/server parity › mirrors CARD_TYPES, LOCALES and FAVORITE_CATEGORIES`     | AC-1   | `src/types/customer-profile.ts` constants equal the server's         |

## Red run

`NODE_ENV=test bun --bun vitest run lib/customer-profile.test.ts` — against `lib/customer-profile.ts` stubbed to keep the three constants but make `toCustomerProfile`/`parseCustomerProfileInput` both `throw new Error("not implemented")`:

```
 Test Files  1 failed (1)
      Tests  10 failed | 1 passed (11)
```

10 of 11 failed for the right reason (`Error: not implemented` instead of the expected shape/`ValidationError`). The 1 passing test is the constants-parity check, which is legitimately already true in the stub (the enums were left intact) — not a false positive, since the stub still has no working functions.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`), with the real `lib/customer-profile.ts` implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  24 passed (24)
      Tests  155 passed (155)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`) and instructed falling back to `verify` — expected in an engineer container per AGENTS.md (E2E runs in the QA phase / CI). This ticket is a pure value-object/parser module with no route wiring or UI change, so it owes no E2E coverage.

TDD-RESULT: 155 passed, 0 failed
