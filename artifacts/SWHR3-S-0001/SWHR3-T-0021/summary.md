---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0021
branch: vortex/feat/SWHR3-T-0021-15-form-primitives-validators-and-api-cl-268bab18
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0021/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0021: Form primitives, validators and API client

## What changed

Added the six new `src/components/ui/` form primitives (Input, Label, Checkbox, Select, Alert,
FormField) following the `button.tsx` pattern, matched to the field styling in the sign-on and
create-customer mockups; identical client/server validators (C3) sharing one case table; and the
`apiFetch`/`ApiError` client (C4) that understands the error body `lib/errors.ts` produces.

## Files

- `src/components/ui/input.tsx` + `input-variants.ts` — text input, `default`/`error` variants.
- `src/components/ui/label.tsx` — native `<label>`, no variants.
- `src/components/ui/checkbox.tsx` — native checkbox with label + helper text, helper linked via
  `aria-describedby` (kept out of the checkbox's accessible name).
- `src/components/ui/select.tsx` — native `<select>` styled like Input, with a chevron icon.
- `src/components/ui/alert.tsx` + `alert-variants.ts` — `Alert`/`AlertTitle`/`AlertDescription`,
  `default`/`destructive` variants.
- `src/components/ui/form-field.tsx` — label + control slot + helper/error text; clones the control
  to set `id`, `aria-invalid` and `aria-describedby`.
- `src/components/ui/index.ts` — barrel export for all of the above plus the existing `Button`.
- `src/components/ui/{input,label,checkbox,select,alert,form-field}.test.tsx` — one `*.test.tsx` per
  primitive.
- `lib/validation.ts` — server validators, rules read from `AUTH_CONFIG`.
- `src/utils/form-validation.ts` — client validators, identical rules read from
  `src/constants/auth.ts`.
- `lib/validation.cases.ts` — the shared case table (no imports), run by both `lib/validation.test.ts`
  and `src/utils/form-validation.test.ts`.
- `src/utils/api.ts` — `apiFetch`, `ApiError`.
- `lib/validation.test.ts`, `src/utils/form-validation.test.ts`, `src/utils/api.test.ts`.

## AC coverage

- AC-1 — `src/components/ui` exports `Input`, `Label`, `Checkbox`, `Select`, `Alert`, `FormField`
  (`index.ts`); `FormField` links error text via `aria-invalid`/`aria-describedby`
  (`form-field.test.tsx`); `lib/validation.ts` and `src/utils/form-validation.ts` both export the
  five validators returning `string | undefined`; `src/utils/api.ts` exports `apiFetch`/`ApiError`.
- AC-2 — every new primitive with variants (`Input`, `Alert`) puts its `cva` call in a separate
  `*-variants.ts`, `cn()` applied last (verified by inspection); each primitive has its own
  `*.test.tsx`.
- AC-3 — `lib/validation.test.ts` and `src/utils/form-validation.test.ts` both run
  `lib/validation.cases.ts` (48 assertions total) and return the same verdict for every case.
- AC-4 — `src/utils/api.test.ts` covers a JSON error body → `ApiError { status, code, fieldErrors }`.
- AC-5 — `form-field.test.tsx` › "shows the given error text..." and "keeps the control's current
  value...".

## Verification

```
$ NODE_ENV=test bun --bun vitest run <9 new test files>   # red, before implementation
Test Files  9 failed (9)
$ bun run verify                                            # green, after implementation
Test Files  19 passed (19)
     Tests  119 passed (119)
```

`bun run verify:full`'s E2E tier could not run — Chromium is not installed in this container
(documented AGENTS.md fallback, same as SWHR3-T-0020). See `tdd-test-result.md` for the full
red/green detail.

## Notes

- `lib/validation.cases.ts` has no imports, per the PLAN, so both `tsconfig.json` (client) and
  `tsconfig.node.json` (server) can type-check it. Unlike `tsconfig.node.json` (which is `composite`
  and requires every file reached by import to also be in its own `include`), `tsconfig.json` is not
  composite, so `src/utils/form-validation.test.ts` importing `lib/validation.cases.ts` type-checked
  with no config change — confirmed empirically before writing the test, so the PLAN's fallback
  (duplicating the table into `src/utils/form-validation.cases.ts`) was not needed.
- Checkbox's first draft nested the helper text inside the same `<label>` as the checkbox, which
  pulled the helper text into the checkbox's accessible name and failed
  `getByRole("checkbox", { name: ... })`. Fixed by moving the helper text to a sibling `<p>` linked
  via `aria-describedby` — see `tdd-test-result.md`.
