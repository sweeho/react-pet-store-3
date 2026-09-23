# PLAN — SWHR3-T-0021: Form primitives, validators and API client

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 15. Form Validation & Constraints (every checkbox in it is tagged `(SWHR3-T-0021)`)
- **Requirements:** User registration screen; Customer creation screen; Customer sign-on screen (shared field behaviour)
- **Depends on:** SWHR3-T-0016 (error body shape; transitively lib/auth-config.ts)

## Objective

Every form in this capability, and in the capabilities after it, is built from the same field primitives, validated by the same rules on both sides, and talks to the API through one client that understands the error body.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-sign-on.html`
- `artifacts/SWHR3-S-0001/design/mockup-create-customer.html`
- `artifacts/SWHR3-S-0001/design/mockup-registration-error.html` (Alert)
- `artifacts/SWHR3-S-0001/design/mockup-account-profile.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Primitives in `src/components/ui/`, following `button.tsx` (cva variants in a separate `*-variants.ts`, `cn()` last, `forwardRef`):
   - `input.tsx` + `input-variants.ts`;
   - `label.tsx`;
   - `checkbox.tsx`: a native checkbox with its label and helper text;
   - `select.tsx`: a native `<select>` styled like Input;
   - `alert.tsx` + `alert-variants.ts`: `default` and `destructive`, with a title and a description;
   - `form-field.tsx`: label, control slot, helper text and error text, linked with `aria-invalid` and `aria-describedby`.
1. Export them all from `src/components/ui/index.ts`. Styling uses only the tokens in `src/index.css`, matching the mockups: bordered `--input`, `--radius`, `--ring` focus, `--destructive` error text.
1. Create `lib/validation.ts` and `src/utils/form-validation.ts` (C3) with identical rules drawn from `AUTH_CONFIG` / `src/constants/auth.ts`. Email is a pragmatic single-`@` pattern with a dot in the domain.
1. Create `src/utils/api.ts` (C4). `apiFetch` sends and receives JSON with `credentials: "same-origin"`. On non-2xx it throws `ApiError` built from the body's `message`, `data.code` and `data.fieldErrors`, matching the body shape pinned by SWHR3-T-0016.
1. Tests: one `*.test.tsx` per primitive. `src/utils/form-validation.test.ts` and `lib/validation.test.ts` import one shared case table, `lib/validation.cases.ts` (a plain data module with no imports, so both tsconfigs can type-check it), and assert the same verdicts. `src/utils/api.test.ts` covers success, an error with fieldErrors, and a non-JSON error.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## Notes

- If `src/utils/form-validation.test.ts` cannot import `lib/validation.cases.ts` under `tsconfig.json` (which includes only `src`), duplicate the table into `src/utils/form-validation.cases.ts` and add a server test asserting the two tables are deep-equal.

## File/module ownership

This ticket may create or modify only these files:

- `src/components/ui/{input,input-variants,label,checkbox,select,alert,alert-variants,form-field}.tsx|ts + *.test.tsx`
- `src/components/ui/index.ts`
- `lib/validation.ts`
- `lib/validation.test.ts`
- `lib/validation.cases.ts`
- `src/utils/form-validation.ts`
- `src/utils/form-validation.test.ts`
- `src/utils/form-validation.cases.ts` (only if the Notes fallback is needed)
- `src/utils/api.ts`
- `src/utils/api.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
