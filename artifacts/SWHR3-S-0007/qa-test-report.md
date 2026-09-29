---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR3-S-0007
idea: Not Provided
branch: vortex/sprint/swhr3-s-0007-45e84ed1
upstream:
  [
    artifacts/SWHR3-S-0007/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0007/integration-test-result.md,
    artifacts/SWHR3-S-0007/integration-defects-resolution.md,
  ]
---

# QA test report — SWHR3-S-0007

## Executive Summary

**Verdict: PASS.** The integrated sprint branch (head 8b48398) fixes SWHR3-T-0100: `POST /api/orders` now refuses every non-JSON content type with 415 before reading the body. The build, lint, typecheck, 720 unit tests and 32 Playwright tests all passed. All six scenarios of requirement SWHR3-R-0049 have a named passing test. No defects were found.

## E2E Test Status

Full detail in `artifacts/SWHR3-S-0007/integration-test-result.md`. Playwright: `32 passed (11.4s)`, 0 failed, 0 skipped, including `e2e/checkout.spec.ts` 4/4 (the JSON browser checkout still works). No E2E spec sends a non-JSON body, so the refusal scenarios are verified by route tests in `routes/api/orders/index.post.test.ts`, which construct a real `H3Event` and are part of the unit run below; I did not send live non-JSON requests to a running server.

SCENARIO-VERDICT: Order submission accepts only JSON / Form-encoded submission is refused — pass ([SWHR3-C-0146])
SCENARIO-VERDICT: Order submission accepts only JSON / Plain-text submission is refused — pass ([SWHR3-C-0148])
SCENARIO-VERDICT: Order submission accepts only JSON / Multipart submission is refused — pass ([SWHR3-C-0149])
SCENARIO-VERDICT: Order submission accepts only JSON / Submission without a content type is refused — pass ([SWHR3-C-0150])
SCENARIO-VERDICT: Order submission accepts only JSON / JSON submission with a charset parameter is accepted — pass ([SWHR3-C-0152])
SCENARIO-VERDICT: Order submission accepts only JSON / Refused submission records no order log entry — pass ([SWHR3-C-0154], plus [SWHR3-C-0155] for the signed-out case)

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
 Test Files  110 passed (110)
      Tests  720 passed (720)
   Duration  16.58s
```

Exit 0. `bun run build` also exited 0. Previous sprint's run had 704 tests in 109 files; this sprint adds 16 tests in 1 file more (different sprint branch, so a count comparison only, not a coverage claim).

## Code Review

No notable concerns observed. `lib/json-body.ts` takes the media type from the `content-type` header, lowercases it, strips parameters, and throws `UnsupportedMediaTypeError` unless it equals `application/json`, before calling `readBody`. Design fidelity: no design reference applies to this bugfix.

## Coverage Summary

No coverage tool was run and no coverage numbers are claimed. Test volume: 110 unit files / 720 tests, 32 E2E tests.

## Issues Found

None. See `artifacts/SWHR3-S-0007/integration-defects-resolution.md` (no defects, no DEFECT tickets filed).

## Recommendation

Proceed: fire `validation.all_acs_passed`. SWHR3-T-0100's fix holds and no defects were found.
