---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0021
branch: vortex/feat/SWHR3-T-0021-15-form-primitives-validators-and-api-cl-268bab18
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0021/PLAN.md]
---

# TDD result — SWHR3-T-0021

## Test cases

| Test                                                                          | Covers     | Intent                                                                                                                                  |
| ----------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/input.test.tsx` (4 cases)                                  | AC-1, AC-2 | default/error variant classes, typed input, forwarded ref                                                                               |
| `src/components/ui/label.test.tsx` (2 cases)                                  | AC-1, AC-2 | `htmlFor` association, className merge                                                                                                  |
| `src/components/ui/checkbox.test.tsx` (3 cases)                               | AC-1, AC-2 | label + helper text, toggling, controlled checked state                                                                                 |
| `src/components/ui/select.test.tsx` (3 cases)                                 | AC-1, AC-2 | native select styled like Input, onChange, forwarded ref                                                                                |
| `src/components/ui/alert.test.tsx` (2 cases)                                  | AC-1, AC-2 | default/destructive variants with title + description                                                                                   |
| `src/components/ui/form-field.test.tsx` (4 cases)                             | AC-1, AC-5 | `aria-describedby` to helper/error text, `aria-invalid`, value kept on error appearing                                                  |
| `lib/validation.test.ts` (24 cases, `it.each` over `lib/validation.cases.ts`) | AC-1, AC-3 | server validators against the shared case table                                                                                         |
| `src/utils/form-validation.test.ts` (24 cases, same shared table)             | AC-1, AC-3 | client validators return the same verdict as the server for every case                                                                  |
| `src/utils/api.test.ts` (3 cases)                                             | AC-1, AC-4 | success path (JSON, `credentials: "same-origin"`), JSON error → `ApiError` with `code`/`fieldErrors`, non-JSON error → fallback message |

AC-2 ("each new primitive follows the button pattern... and has its own `*.test.tsx`") is a structural
requirement verified by inspection: `input-variants.ts`/`alert-variants.ts` hold the `cva` calls,
`cn()` is applied last in every primitive, and each of the six new primitives has its own test file
listed above.

## Red run

`NODE_ENV=test bun --bun vitest run <all 9 new test files>`, before any of the corresponding source
files existed:

```
FAIL |client| src/components/ui/alert.test.tsx — Failed to resolve import "./alert"
FAIL |client| src/components/ui/form-field.test.tsx — Failed to resolve import "./form-field"
FAIL |client| src/components/ui/select.test.tsx — Failed to resolve import "./select"
FAIL |client| src/components/ui/input.test.tsx — Failed to resolve import "./input"
FAIL |client| src/components/ui/checkbox.test.tsx — Failed to resolve import "./checkbox"
FAIL |client| src/components/ui/label.test.tsx — Failed to resolve import "./label"
(lib/validation.test.ts, src/utils/form-validation.test.ts, src/utils/api.test.ts failed the same way)
Test Files  9 failed (9)
     Tests  no tests
```

One intermediate red also occurred and was fixed before the final green: the first `checkbox.tsx`
draft nested the helper text inside the same `<label>` as the checkbox's name, so
`getByRole("checkbox", { name: "Remember my user name" })` failed because the accessible name
included the helper text too. Fixed by moving the helper text to a sibling `<p>` linked via
`aria-describedby` instead of being nested inside the label's accessible name.

## Green run

`bun run verify` (lint + typecheck + full unit/integration suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  19 passed (19)
      Tests  119 passed (119)
```

`bun run verify:full`'s E2E tier could not run: the preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed in this container. Same documented AGENTS.md fallback as
SWHR3-T-0020's run — E2E runs in QA/CI, not retried here. `verify` is the gate of record.

TDD-RESULT: 119 passed, 0 failed
