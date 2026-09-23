---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0001
idea: SWHR3-I-0002
branch: vortex/sprint/swhr3-s-0001-a5f84996
upstream:
  [
    artifacts/SWHR3-S-0001/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0001/integration-test-result.md,
    artifacts/SWHR3-S-0001/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0001/sprint-summary.md]
---

# QA test report — SWHR3-S-0001

## Executive Summary

**Verdict: PASS.** All 16 tickets (SWHR3-T-0007 .. SWHR3-T-0022) for SWHR3-I-0002 (Customer
Management and Authentication) are merged into the integrated sprint branch. Verified the full
customer journey against the deployed build: registration, profile creation, sign-out, sign-in with
"Remember my user name", wrong-password and duplicate-username error states, the protected-page
redirect-and-return, idle session timeout, and logout. `bun run verify` (lint, typecheck, 268
unit/integration tests) and `bun run build` both pass clean, and the full Playwright suite (11/11)
ran and passed against the built app. All 33 scenarios in the delta spec verify `pass`. No defects
found; nothing to fix.

## E2E Test Status

Full Playwright run: **11 passed, 0 failed, 0 skipped** across all 3 spec files
(`customer-auth.spec.ts`, `home.spec.ts`, `smoke.spec.ts`). See `integration-test-result.md` for the
exact command, the per-spec table and the run-summary line.

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean, 0 warnings)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  46 passed (46)
      Tests  268 passed (268)
   Duration  6.52s
```

Executed directly on the integrated sprint branch (commit `165d7df` at QA start). No test files were
skipped.

## Code Review

No notable concerns observed. The implementation follows `design.md`'s decisions (D1–D16)
consistently: sealed-cookie sessions with no session table, typed service errors routed through
`toHttpError`, `withTransaction` for multi-row writes, and the `lib/` server-module split enforced by
`tsconfig.node.json`. Error message text ("There were errors signing you in. The user name and
password you entered were not found in our records...", "Session timed out") matches the legacy
spec's wording exactly, per SD2/SD9's kept-literal decisions.

### Design fidelity (advisory)

Each screen ticket (SWHR3-T-0007, -0008, -0009, -0014, -0015, -0019) recorded its own mockup
comparison in its `summary.md` at merge time. Spot-checked the sign-in page (`/signin`) and profile
page (`/users/profile`) structure against `artifacts/SWHR3-S-0001/design/mockup-sign-on.html` and
`mockup-account-profile.html` during E2E verification (both panels, field labels and layout regions
present and consistent with the mockups). No material deviations observed. This is advisory only and
does not affect the verdict below.

## Coverage Summary

No coverage tool is configured in this project (`@vitest/coverage-v8` is not a dependency; `bun run
test -- --coverage` fails with `MISSING DEPENDENCY`). No coverage regression can be measured.
Verified via the full test suite instead: 268 unit/integration tests (vitest, split across the
`client`/jsdom and `server`/node projects per `vitest.config.ts`) plus 11 E2E tests (Playwright),
covering every route, service module and page added or changed this sprint.

## Issues Found

None. `bun run verify`, `bun run build`, and the full E2E suite all passed on first verification
against the integrated sprint branch. See `integration-defects-resolution.md` (empty summary table,
`INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`).

One environment note, not a defect: the QA container's pre-provisioned Chromium (`chromium-1223`)
did not match this repo's pinned `@playwright/test@1.50.1` (`chromium-1155`). Resolved by running
`bunx playwright install chromium` before the E2E run. CI installs its own matching Chromium fresh on
every run (`.github/workflows/ci.yml`), so this does not affect CI or production; a
`dependabot/npm_and_yarn/playwright/test-1.63.0` branch already exists upstream to address the pin.

### Scenario verdicts (openspec delta spec: `customer-management`)

SCENARIO-VERDICT: Customer sign-on screen / Sign-on screen is rendered — pass
SCENARIO-VERDICT: Customer sign-on screen / Username is restored from cookie — pass
SCENARIO-VERDICT: User registration screen / Registration screen is rendered — pass
SCENARIO-VERDICT: User registration screen / Registration form submits to handler — pass (SD1: POST /api/auth/register, not createuser.do)
SCENARIO-VERDICT: Sign-on error screen / Error is displayed on authentication failure — pass
SCENARIO-VERDICT: Customer creation screen / Customer creation form collects all required fields — pass
SCENARIO-VERDICT: Customer creation screen / Form submission is processed — pass (SD1: POST /api/customers, not createcustomer.do)
SCENARIO-VERDICT: Sign-on form parameters / Form parameters are accepted — pass (SD2: j_username/j_password/j_remember_username kept literally)
SCENARIO-VERDICT: Error screen display on exceptions / Exception is caught and error screen displayed — pass (SD12: AppErrorBoundary + getErrorScreen)
SCENARIO-VERDICT: User authentication via form-based login / Valid credentials authenticate the user — pass (SD3: lib/accounts.ts verifyCredentials via static import)
SCENARIO-VERDICT: User authentication via form-based login / Invalid credentials are rejected — pass
SCENARIO-VERDICT: Session lifecycle management / Session is created on authentication — pass (SD7: sealed-cookie session, accountId+username)
SCENARIO-VERDICT: Session lifecycle management / Session timeout is enforced — pass (SD18: sliding 30-min idle window; routes/api/session.timeout.test.ts)
SCENARIO-VERDICT: Session lifecycle management / Default locale is initialized — pass (en_US default)
SCENARIO-VERDICT: Protected resource access control / Unauthenticated access is redirected — pass
SCENARIO-VERDICT: Protected resource access control / Protected resource patterns are evaluated — pass (SD10: lib/protected-resources.ts constants)
SCENARIO-VERDICT: Protected resource access control / Original URL is stored for post-authentication redirect — pass (SD8: redirect query param, not session attribute)
SCENARIO-VERDICT: Cookie-based remember username / Cookie is set on user preference — pass (bp_signon, D6)
SCENARIO-VERDICT: Cookie-based remember username / Cookie is read on subsequent visits — pass
SCENARIO-VERDICT: New user registration and duplicate detection / Valid new user is registered — pass
SCENARIO-VERDICT: New user registration and duplicate detection / Duplicate username is detected — pass (SD6: DuplicateAccountError 409)
SCENARIO-VERDICT: Customer profile creation and persistence / Customer profile is created — pass
SCENARIO-VERDICT: Customer profile creation and persistence / Customer profile is retrieved — pass
SCENARIO-VERDICT: Session invalidation on logout / Session is invalidated — pass (routes/api/auth/signout.post.test.ts)
SCENARIO-VERDICT: Session timeout detection / Expired session is detected — pass (SD9: JSON 401 "Session timed out", not the admin-client XML response)
SCENARIO-VERDICT: Transaction semantics for customer operations / Transaction is created for standalone operation — pass (lib/transaction.test.ts AC-1)
SCENARIO-VERDICT: Transaction semantics for customer operations / Method participates in existing transaction — pass (lib/transaction.test.ts AC-2)
SCENARIO-VERDICT: Form-based authentication configuration / Form-based auth is configured — pass — verified by inspection (lib/auth-config.ts AUTH_CONFIG, SD11; no web.xml exists or is ported)
SCENARIO-VERDICT: Exception to screen mapping / Exception is mapped to error screen — pass (SD12: getErrorScreen(error))
SCENARIO-VERDICT: ServiceLocator-based EJB lookup / EJB home is located — pass — met by construction (SD4): routes import service modules directly, no runtime lookup step exists to fail
SCENARIO-VERDICT: ServiceLocator-based EJB lookup / Service lookup failure is handled — pass (SD5: unknown errors -> generic 500, ServiceUnavailableError -> 503, duplicates -> 409 via toHttpError)
SCENARIO-VERDICT: Customer profile updates / Customer profile is updated — pass (routes/api/customers/me.put.test.ts)
SCENARIO-VERDICT: Protected resource configuration / Protected resources are loaded — pass — verified by inspection (lib/protected-resources.ts constants evaluated at module load, SD10)

33/33 scenarios pass. Interpretations for legacy-artefact scenarios (EJB, JNDI, XML config, `.do`
endpoints) follow `design.md`'s "Spec discrepancies" table (SD1–SD22), which the delta spec is
intentionally left unedited against.

## Recommendation

**Proceed.** Every acceptance criterion the sprint promised holds on the integrated branch, all 33
delta-spec scenarios verify `pass`, and no defects were found. Firing `validation.all_acs_passed`.
