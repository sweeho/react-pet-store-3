# PLAN — SWHR3-T-0020: Auth configuration and the lib/ server-module harness

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 14. Security Configuration (every checkbox in it is tagged `(SWHR3-T-0020)`)
- **Requirements:** Form-based authentication configuration
- **Depends on:** none: first ticket of the sprint

## Objective

One module holds every authentication setting (the equivalent of web.xml login-config and session-config), and the new lib/ directory is type-checked and tested like routes/.

## Design reference

- n/a (no screen)
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `lib/auth-config.ts` (C1, design.md D3/D5/D6) with `AUTH_CONFIG` as a deeply `as const` object and `getSessionSecret()`: `process.env.SESSION_SECRET` if set; otherwise throw when `NODE_ENV === "production"`, else return a fixed development string of at least 32 characters.
1. Create `src/constants/auth.ts` with the client-safe mirror: sign-in path, `/users/create` and `/users/profile` paths, user name and password limits, the username pattern source and `REMEMBER_COOKIE_NAME`.
1. Harness: add `"lib"` to `include` in `tsconfig.node.json`. In `vitest.config.ts`, add `lib/**/*.test.ts` and `middleware/**/*.test.ts` to the server project's `include`, and add `lib/**` and `middleware/**` to the client project's `exclude`.
1. Add `.env.example` with `SESSION_SECRET=` and a one-line comment, and add a `SESSION_SECRET` note to `doc/DEPLOYMENT.md`.
1. Tests: `lib/auth-config.test.ts` covers the configured values, the three `getSessionSecret` branches (stub env), and a parity check against the `src/constants/auth.ts` values.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `lib/auth-config.ts`
- `lib/auth-config.test.ts`
- `src/constants/auth.ts`
- `tsconfig.node.json`
- `vitest.config.ts`
- `.env.example`
- `doc/DEPLOYMENT.md` (SESSION_SECRET note)

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
