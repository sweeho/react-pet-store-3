---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0007
ticket: SWHR3-T-0100
---

# TDD result — SWHR3-T-0100

## Test cases

`routes/api/orders/index.post.test.ts` (real `H3Event` through both middlewares): SWHR3-C-0146 (urlencoded), C-0148 (`text/plain`), C-0149 (multipart), C-0150 (no header) each answer 415 `UNSUPPORTED_MEDIA_TYPE` with the order count and cart unchanged and no `checkout: order` log line; C-0152 (`application/json; charset=utf-8` gives 201); C-0154 (no log line for refused submissions); C-0155 (signed out with `text/plain` gives 401). `lib/json-body.test.ts`: C-0151 (media-type table: three accepted, four refused) and C-0147 (urlencoded refused, maps to 415). `lib/errors.test.ts`: the new error's 415 mapping. C-0153 (browser checkout) is the existing `e2e/checkout.spec.ts` journey, which sends JSON through `apiFetch`; it was not run (no Chromium in this container).

## Red run

`bun run test routes/api/orders/index.post.test.ts lib/json-body.test.ts lib/errors.test.ts` with `readJsonBody` as a `VortexNotImplemented` stub, `UnsupportedMediaTypeError` absent and the route unchanged: 14 failed, 31 passed. Actual route failures, from the log:

- urlencoded and `text/plain`, no header: `AssertionError: promise resolved "{ orderId: 5, …(2) }" instead of rejecting` (the order was placed);
- multipart: `AssertionError: expected HTTPError: Invalid JSON body { …(6) } to match object { status: 415, …(1) }` (the parser's 400);
- unit tests: `promise rejected "Error: VortexNotImplemented"` and `The instanceof assertion needs a constructor but undefined was given`.
  C-0152 and C-0155 pass in red because that behaviour already held. `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 110 files, 720 tests passed. `bun run build` exit 0.

TDD-RESULT: 720 passed, 0 failed
