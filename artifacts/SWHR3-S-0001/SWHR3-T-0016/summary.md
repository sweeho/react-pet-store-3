---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0016
branch: vortex/feat/SWHR3-T-0016-10-service-errors-and-http-error-mapping-d0a5d10c
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0016/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0016: Service errors and HTTP error mapping

## What changed

Added `lib/errors.ts` (interface contract C2): `ServiceError` plus six typed subclasses, and `toHttpError(error)`, which turns a `ServiceError` into an h3 error with `status`/`message`/`data.code` (`data.fieldErrors` for `ValidationError`), passes an existing h3 error through unchanged, and turns anything else into a logged, non-leaking 500.

## Files

- `lib/errors.ts` — `ServiceError` base class and the `DuplicateAccountError` / `DuplicateEmailError` / `ProfileExistsError` / `NotFoundError` / `ValidationError` / `ServiceUnavailableError` subclasses, plus `toHttpError`.
- `lib/errors.test.ts` — unit tests for every subclass's status/code, `fieldErrors`, the unknown-error 500 (no leak, one `console.error` call) and h3 passthrough.
- `routes/api/errors-contract.test.ts` — pins the serialized JSON body (`message`, `data.code`, `data.fieldErrors`) through a real `H3Event` handler, the fixed target for `src/utils/api.ts` (C4, owned by SWHR3-T-0021).

## AC coverage

- AC-1/AC-2 (ServiceLocator-based EJB lookup) — met by construction per design.md SD3/SD4: every route imports its service module statically, so there is no runtime lookup to fail. Recorded in `lib/errors.ts`'s module doc comment.
- AC-3 (typed error classes) — `lib/errors.test.ts › ServiceError subclasses` (8 tests): status, code and message for every subclass, including `ValidationError.fieldErrors`.
- AC-4 (`toHttpError` maps `ServiceError` to an HTTP error with `message`/`data.code`/`data.fieldErrors`) — `lib/errors.test.ts › toHttpError` (basic + fieldErrors + h3 passthrough) and all four cases in `routes/api/errors-contract.test.ts`.
- AC-5 (unknown throw → non-leaking, logged 500) — `lib/errors.test.ts › maps every other thrown value…` / `› maps a thrown string/number/plain object…`, and `routes/api/errors-contract.test.ts › an unexpected throw inside a route…`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/errors.test.ts routes/api/errors-contract.test.ts
Test Files  2 passed (2)
     Tests  17 passed (17)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  10 passed (10)
     Tests  44 passed (44)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 44 passed, 0 failed`.

## Notes

No design reference applies: this ticket is a server-only module (typed errors + HTTP mapping) with no route wired up yet and no UI surface — `mockup-error-screen.html` (linked in `PLAN.md`) is context for the _client-side_ generic screen owned by SWHR3-T-0019, not something this ticket renders.
