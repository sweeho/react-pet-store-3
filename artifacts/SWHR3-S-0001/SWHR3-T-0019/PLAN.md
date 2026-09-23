# PLAN — SWHR3-T-0019: App error screen and exception-to-screen mapping

- **Change:** `swhr3-i-0002-customer-management-and-aut` (read `openspec/changes/swhr3-i-0002-customer-management-and-aut/design.md` first, especially the part under "Rebuild on this repository")
- **tasks.md group:** 13. Error Handling & Exception Mapping (every checkbox in it is tagged `(SWHR3-T-0019)`)
- **Requirements:** Error screen display on exceptions; Exception to screen mapping
- **Depends on:** SWHR3-T-0011 (same file: src/main.tsx; transitively lib/errors.ts and src/utils/api.ts)

## Objective

No failure leaves a blank page. Render errors anywhere under the router show the designed error screen, and API errors map to the right screen or message.

## Design reference

- `artifacts/SWHR3-S-0001/design/mockup-error-screen.html`
- `artifacts/SWHR3-S-0001/design/wireframe-error-screen.html`
- Index: `artifacts/SWHR3-S-0001/design/MANIFEST.md`. Build what the mockup shows; the wireframe gives structure only.

## Steps

1. Create `src/utils/error-screen.ts` with `getErrorScreen(error)` (C16): an `ApiError` with status 401 maps to `signin`; code `DUPLICATE_ACCOUNT` maps to "That user name is already taken"; everything else maps to `error` with the error's message.
1. Create `src/components/error-boundary.tsx` with `AppErrorBoundary`, a class component. `componentDidCatch` logs once with `console.error`, and it renders `RootErrorBoundary` with the caught error. It resets when the location changes.
1. Restyle `src/pages/RootErrorBoundary.tsx` to `mockup-error-screen.html`. It takes an `error?: unknown` prop and renders the heading "Something went wrong", the body copy, Back to the store (`/`) and Sign in again (`/signin`) links, and a Technical detail `<details>` showing the error message.
1. In `src/main.tsx`, wrap the guarded routes in `AppErrorBoundary`, keeping SWHR3-T-0011's `RequireAuth` inside it.
1. Tests: `src/components/error-boundary.test.tsx` renders a child that throws and asserts the heading, links, detail text and a single `console.error`. `src/utils/error-screen.test.ts` covers the three mappings. Update any existing test of `RootErrorBoundary`.

Contracts (C#) and decisions (D#), and the legacy-to-modern mapping (SD#), are in the design.md sections "Interface contracts", "Decisions" and "Spec discrepancies". A step that seems to need a contract change is a plan problem: escalate to planning, do not change the contract in place.

## File/module ownership

This ticket may create or modify only these files:

- `src/utils/error-screen.ts`
- `src/utils/error-screen.test.ts`
- `src/components/error-boundary.tsx`
- `src/components/error-boundary.test.tsx`
- `src/pages/RootErrorBoundary.tsx`
- `src/main.tsx` (error boundary wrapper)

## Definition of Done

- AC-1, AC-2, AC-3, AC-4, AC-5, AC-6: every acceptance criterion on the ticket, in order, is met and covered by a test that fails without the change.
- The criteria worded in legacy terms (`.do` endpoints, EJB, `HttpSession` attributes, XML) are met through the interpretation in design.md "Spec discrepancies".
- The existing test suites and the E2E smoke spec stay green.
