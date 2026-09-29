---
artifact: tdd-test-result
ticket: SWHR3-T-0084
---

# TDD result — SWHR3-T-0084

## Test cases

`lib/checkout-request.test.ts`, run for both `_a` and `_b` suffixes:

- SWHR3-C-0098 / C-0104: complete address accepted; empty telephone recorded as "Enter a telephone."
- SWHR3-C-0100: absent or blank address line 2 is null with no error
- SWHR3-C-0129: whitespace-only postal code is missing with a "Spaces only" message
- SWHR3-C-0130: surrounding spaces trimmed
- SWHR3-C-0133 / C-0134: billing read only from `_a`, shipping only from `_b`
- extra: several blanks recorded in field order, invalid email, non-string value

## Red run

`bun --bun vitest run lib/checkout-request.test.ts` against a stub throwing `VortexNotImplemented`: 20 failed (20).

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 96 files, 599 tests passed.

TDD-RESULT: 599 passed, 0 failed
