# PLAN — SWHR3-T-0013: CustomerProfile JSON shape and input parsing

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 7. Customer Profile Value Object (every checkbox in it is tagged `(SWHR3-T-0013)`)
- **Requirements:** Customer profile creation and persistence; Customer profile updates
- **Depends on:** SWHR3-T-0012 (table types)

## Objective

Define the single JSON shape the profile API returns and accepts, the enumerations, and the parser that turns an untrusted body into a typed input or a field-error map.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-create-customer.html`
- `artifacts/SWHR3-S-0001/design/mockup-account-profile.html` (last-four card display)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/customer-profile.ts` (C14): the types, `CARD_TYPES` / `LOCALES` / `FAVORITE_CATEGORIES` (D10), `toCustomerProfile(account, customer, card)` (card number reduced to `cardNumberLast4`), and `parseCustomerProfileInput(body, mode)`. The parser uses `lib/validation.ts` (C3) and collects every problem before throwing one `ValidationError` keyed by dotted path. `address.street2` is optional. In `update` mode an empty `card.cardNumber` means keep the card on file (D9). Card numbers are 12–19 digits after stripping spaces. Expiry month is 1–12, and expiry year is the current year up to 15 years ahead.
1. Create `src/types/customer-profile.ts`, mirroring the two types and three constants for the client (D13).
1. Tests: `lib/customer-profile.test.ts` covers a complete body, each missing field, a bad email, card type and locale, update-mode empty card, and the masking. A parity assertion checks that the client constants equal the server constants.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/customer-profile.ts`
- `lib/customer-profile.test.ts`
- `src/types/customer-profile.ts`

**Deviation (minor, no contract/ownership impact):** also added
`src/types/customer-profile.ts` to `tsconfig.node.json`'s `include` array
(one line), mirroring the exact precedent T-0020 set for
`src/constants/auth.ts`. Without it, `tsc --build` refuses the parity
test's cross-import with TS6307 ("File ... is not listed within the file
list of project ... tsconfig.node.json"). No other ticket in this sprint
phase touches `tsconfig.node.json`, so this carries no ownership conflict.

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
