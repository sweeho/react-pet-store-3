---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0012
branch: vortex/feat/SWHR3-T-0012-6-customer-address-card-and-preference-s-fad40607
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0012/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# TDD result — SWHR3-T-0012

## Test cases

| Test                                                                                                 | Covers     | Intent                                                                     |
| ---------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `lib/customer-storage.test.ts › persists every customer and card column and reads it back unchanged` | AC-1, AC-2 | every `customers`/`creditCards` column round-trips through insert + select |
| `lib/customer-storage.test.ts › defaults locale to en_US and allows a null street2/favoriteCategory` | AC-2       | `locale` default, nullable `street2`/`favoriteCategory`                    |
| `lib/customer-storage.test.ts › deletes the card row when its customer row is deleted`               | AC-3       | `ON DELETE CASCADE` from `creditCards.customerId` to `customers.id`        |
| `lib/customer-storage.test.ts › rejects a second customer row for the same account`                  | AC-3       | unique index on `customers.accountId`                                      |
| `lib/customer-storage.test.ts › rejects a duplicate email across different accounts`                 | AC-2       | unique index on `customers.email`                                          |
| `routes/api/users/*.test.ts` (existing, unmodified)                                                  | AC-4       | `users` table, its seed and `/api/users` routes behave exactly as before   |

## Red run

`NODE_ENV=test bun --bun vitest run lib/customer-storage.test.ts`, with `db/schema.ts` and `db/client.ts` temporarily reverted to their pre-ticket state (`git stash push -- db/schema.ts db/client.ts drizzle/`) so the test ran against the schema as it existed before this change:

```
FAIL  |server| lib/customer-storage.test.ts > customers/creditCards storage (AC-1, AC-2) > persists every customer and card column and reads it back unchanged
TypeError: undefined is not an object (evaluating 'this.table[Table.Symbol.Columns]')

FAIL  |server| lib/customer-storage.test.ts > … (4 more, same cause: `customers`/`creditCards` don't exist)

Test Files  1 failed (1)
     Tests  5 failed (5)
```

`git stash pop` restored the schema/client changes immediately after.

## Green run

`bun run verify` (this stack's full pre-commit gate: `bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  23 passed (23)
      Tests  144 passed (144)
```

`bun run verify:full` was also run; the browser-free `verify` portion (above) passed identically, then the E2E preflight reported Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") and instructed falling back to `verify` rather than installing a browser here — per AGENTS.md this is expected in an engineer container; E2E runs in the QA phase / CI. This ticket touches no route or UI, so it owes no E2E coverage; `e2e/smoke.spec.ts` is unaffected (only exercises page load, not this schema).

TDD-RESULT: 144 passed, 0 failed
