# Summary — SWHR3-T-0084

Added `lib/checkout-request.ts` with `FieldErrorCollector` (`fieldErrors` by request param, `missingFields` in order) and `extractContactInfo(fields, suffix, errors)` (C6). It walks `CONTACT_INFO_FIELDS`, trims values, records "Enter a <label>." for empty and "Spaces only — enter a <label>." for whitespace-only required values, turns a blank `address_2` into null, checks email with `validateEmail` from `lib/validation.ts` (SD14), and returns null when anything was recorded.

Files: `lib/checkout-request.ts`, `lib/checkout-request.test.ts` (AC-1 via C-0100; AC-2 via C-0129, C-0130; also C-0098, C-0104, C-0133, C-0134). No UI change, so no design consulted.

Decision: an invalid email is recorded in `fieldErrors` but not `missingFields`, since it is present but wrong. `extractCreditCard` and `parseCheckoutRequest` belong to other tickets.

Verification: red run 20 failed against the stub; `bun run verify` exit 0, 599 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
