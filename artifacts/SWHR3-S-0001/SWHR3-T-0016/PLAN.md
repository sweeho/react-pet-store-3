# PLAN — SWHR3-T-0016: Service errors and HTTP error mapping

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 10. EJB Service Layer (every checkbox in it is tagged `(SWHR3-T-0016)`)
- **Requirements:** ServiceLocator-based EJB lookup
- **Depends on:** SWHR3-T-0020 (lib/ harness)

## Objective

Give every service one set of typed errors and every route one function that turns any thrown value into a safe, typed HTTP error.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-error-screen.html` (what a generic failure must not leak)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/errors.ts` (C2). The module doc comment states the service-resolution rule of design.md SD3/SD4: services are plain modules imported statically, and there is no runtime lookup.
1. `toHttpError(error)` maps a `ServiceError` to h3 `createError({ status, message, data: { code, fieldErrors? } })`. Any other value is logged once with `console.error` and becomes a 500 with the message "Internal server error" and `data.code` `INTERNAL_ERROR`; the original message and stack never go into the response. An h3 error passes through unchanged.
1. Tests: `lib/errors.test.ts` covers each subclass's status and code, `fieldErrors` passthrough, the unknown-error 500 with no leak and one log call, and h3 error passthrough. Verify the serialized body shape through a real handler in `routes/api/errors-contract.test.ts` (`H3Event` style), so C4's client parser has a fixed target.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/errors.ts`
- `lib/errors.test.ts`
- `routes/api/errors-contract.test.ts`

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
