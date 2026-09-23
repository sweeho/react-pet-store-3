# PLAN — SWHR3-T-0014: Create-customer page

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 8. Customer Creation Form (every checkbox in it is tagged `(SWHR3-T-0014)`)
- **Requirements:** Customer creation screen
- **Depends on:** SWHR3-T-0013 (types, constants)

## Objective

The signed-in new customer completes contact, card and preference details on /users/create and lands on their profile.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-create-customer.html`
- `artifacts/SWHR3-S-0001/design/wireframe-create-customer.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `src/pages/users/create.tsx` (route `/users/create`), laid out as `mockup-create-customer.html`: the heading, "All fields are required except the second address line", the read-only user name (from `GET /api/session` via `apiFetch`), and three sections.
1. Contact information: first name, last name, street address, street address line 2 (optional), city, state/province, ZIP/postal code, country, telephone, email.
1. Credit card: card type `Select` from `CARD_TYPES`, card number, expiry month and year `Select`s.
1. Profile: preferred language `Select` from `LOCALES`, favourite category `Select` from `FAVORITE_CATEGORIES`, and the MyList and pet-tips `Checkbox`es with their helper text. Then Cancel and Create account.
1. Use `FormField` for every control, with `required` and `maxLength` attributes so the browser blocks empty submits. The form is controlled, so values survive a failed submit.
1. Submit a `CustomerProfileInput` to `POST /api/customers` (C15). On 201, navigate to `/users/profile`. On 422, map `fieldErrors` (dotted paths) under their fields. On 409 `DUPLICATE_EMAIL`, show the error under Email.
1. Tests: `src/pages/users/create.test.tsx` covers every section and field, the read-only user name, the POST body shape, the 422 mapping with values kept, and navigation on 201.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## Notes

- The POST /api/customers handler is built in parallel by SWHR3-T-0015 against contract C15; mock `fetch` in the page test. The real round trip is covered by SWHR3-T-0022.

## File/module ownership

This ticket may create or modify only these files:

- `src/pages/users/create.tsx`
- `src/pages/users/create.test.tsx`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
