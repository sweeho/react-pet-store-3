# Summary — SWHR3-T-0091

Added `lib/contact-info.ts` per C2: the `ContactInfo` interface and the ordered `CONTACT_INFO_FIELDS` table (key, request param, mockup label, required; only `address2` optional). Test in `lib/contact-info.test.ts` covers SWHR3-C-0137 (AC-1): key order, the single optional field, params and labels.

No UI change, so no design consulted. Red used an empty table rather than a throwing stub, since a constant cannot throw.

Verification: red run 2 failed; `bun run verify` exit 0, 567 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
