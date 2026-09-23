---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0014
branch: vortex/feat/SWHR3-T-0014-8-create-customer-page-7950de0e
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0014/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0014: Create-customer page

## What changed

Added `src/pages/users/create.tsx`: the page from `mockup-create-customer.html`'s body (storefront
topbar/catnav/footer are out of scope, per `MANIFEST.md`). Shows the signed-in user name read-only
(`GET /api/session`), with the Contact information, Credit card and Profile sections, all fields
required except the second address line. Submits a `CustomerProfileInput` to `POST /api/customers`; on
201 it navigates to `/users/profile`; on 422 it maps `fieldErrors` under their fields with every value
kept; on 409 `DUPLICATE_EMAIL` (which carries no `fieldErrors` of its own) it shows the error under
Email.

## Files

- `src/pages/users/create.tsx` — new page.
- `src/pages/users/create.test.tsx` — 6 cases.

## AC coverage

- AC-1 — the screen displays Contact Information, Credit Card Information and Profile sections with
  every specified field: `create.test.tsx › shows the signed-in user name read-only, and the three
sections with their fields`.
- AC-2 — submission posts to the customer-creation endpoint: `POST /api/customers` (the modern
  equivalent of `createcustomer.do?action=create`, design.md SD1) — `create.test.tsx › submits a
CustomerProfileInput to POST /api/customers...`.
- AC-3 — `/users/create` matches the mockup's read-only user name and three sections: same test as
  AC-1, plus the field-presence assertions per section.
- AC-4 — 201 → `/users/profile`; 422 → per-field errors with values kept; 409 `DUPLICATE_EMAIL` → error
  under Email: the three corresponding `create.test.tsx` cases.
- AC-5 — every field required except street2, and the browser blocks an empty-required submit:
  `create.test.tsx › marks every field required...` and `› blocks submission when a required field is
empty`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run src/pages/users/create.test.tsx   # red, before create.tsx existed
Error: Failed to resolve import "./create"
$ bun run verify                                                        # green, after implementation
Test Files  44 passed (44)
     Tests  263 passed (263)
```

`bun run verify:full`'s E2E tier could not run — Chromium is not installed in this container
(documented AGENTS.md fallback, same as every prior ticket this sprint). See `tdd-test-result.md` for
the full red/green detail.

## Notes

- `POST /api/customers` is mocked in the page test (per the PLAN's own Notes: the real handler is
  SWHR3-T-0015, built in parallel against the same C15 contract; SWHR3-T-0022 covers the real round
  trip).
- State/Province and Country are plain text `Input`s, not `Select`s, even though the mockup styles them
  with a chevron: `lib/customer-profile.ts` validates both as free text (no `STATES`/`COUNTRIES` enum
  exists anywhere in the data model), and the PLAN's own field list for these two sections only calls
  out `Select` explicitly for Card type, Expiry month/year, Preferred language and Favourite category —
  all genuinely enum-backed. `src/pages/users/profile.tsx` (SWHR3-T-0015) made the same choice for the
  same reason.
- Favourite category is optional in the actual persisted data model
  (`lib/customer-profile.ts`'s `parseCustomerProfileInput` accepts a blank value as `null`), but this
  ticket's AC-5 explicitly asks for every field except street2 to be required at the create step, so its
  `Select` starts on a disabled placeholder option and is marked `required`, forcing an active choice
  during onboarding without changing what the backend itself accepts.
