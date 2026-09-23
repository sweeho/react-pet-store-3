# PLAN — SWHR3-T-0015: Customer profile service, API and account profile page

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 9. Customer Profile Operations (every checkbox in it is tagged `(SWHR3-T-0015)`)
- **Requirements:** Customer profile creation and persistence (retrieved); Customer profile updates
- **Depends on:** SWHR3-T-0013 (profile shape); SWHR3-T-0010 (session, sign-out button)

## Objective

Customers create, read and update their profile through the API, and see and edit it on /users/profile. The user name is shown and cannot be edited, and the card shows only its last four digits.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-account-profile.html`
- `artifacts/SWHR3-S-0001/design/wireframe-account-profile.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/customers.ts` (C15).
1. `createCustomer` parses with `parseCustomerProfileInput(body, "create")`, throws `ProfileExistsError` when the account already has a customer, and throws `DuplicateEmailError` when the email is used by another customer. It inserts the customer and card in one `withTransaction` (C7).
1. `getCustomerProfile` joins accounts, customers and creditCards and returns `toCustomerProfile(...)`, or `null`.
1. `updateCustomer` runs in `withTransaction`. It checks email uniqueness excluding the caller, updates the customer, replaces the card only when a number is given, and bumps `updatedAt`.
1. `deleteCustomer` removes the customer (the card cascades).
1. Create `routes/api/customers/index.post.ts`, `routes/api/customers/me.get.ts` (404 via `NotFoundError` when there is no profile) and `routes/api/customers/me.put.ts`. Each starts with `requireSessionUser` (C8) and ends in `toHttpError`.
1. Replace `src/pages/users/profile.tsx` with the page of `mockup-account-profile.html`: heading "Your account", user name read-only with its note, and the Contact, Credit card (`•••• last4`, with a new number replacing it) and Profile sections, pre-filled from `GET /api/customers/me`. Cancel resets the form; Save changes sends `PUT` and shows the saved state. Mount `SignOutButton` (SWHR3-T-0010). A 404 navigates to `/users/create`. Any other load failure is thrown during render, so the app error boundary shows it.
1. Tests: `lib/customers.test.ts` covers create, get, update (card kept and card replaced), delete, the duplicate-email and profile-exists cases, and rollback when the card insert fails. `routes/api/customers/*.test.ts` covers 401, 201, 200, 404, 409 and 422. `src/pages/users/profile.test.tsx` covers the read-only user name, the masked card, save, the 404 redirect and the thrown error.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/customers.ts`
- `lib/customers.test.ts`
- `routes/api/customers/index.post.ts`
- `routes/api/customers/me.get.ts`
- `routes/api/customers/me.put.ts`
- `routes/api/customers/*.test.ts`
- `src/pages/users/profile.tsx`
- `src/pages/users/profile.test.tsx`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
