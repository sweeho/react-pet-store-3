---
artifact: tdd-test-result
spec: 1
status: complete
author_role: devops
sprint: SWHR3-S-0002
ticket: SWHR3-T-0024
---

# TDD result — SWHR3-T-0024

Test file: `src/utils/tailwind-config-convention.test.ts`

## RED — before the fix

Stashed the fix (restored the zero-byte `tailwind.config.ts` and the original
`components.json`) and ran:

```
bun --bun vitest run src/utils/tailwind-config-convention.test.ts
```

```
 ❯ |client| src/utils/tailwind-config-convention.test.ts (2 tests | 2 failed) 5ms
     × has no tailwind.config.* file at the repository root 3ms
     × blanks components.json's shadcn tailwind.config to the documented v4 value 0ms

 FAIL  |client| src/utils/tailwind-config-convention.test.ts > CSS-first Tailwind convention > has no tailwind.config.* file at the repository root
AssertionError: expected [ 'tailwind.config.ts' ] to deeply equal []

 FAIL  |client| src/utils/tailwind-config-convention.test.ts > CSS-first Tailwind convention > blanks components.json's shadcn tailwind.config to the documented v4 value
AssertionError: expected 'tailwind.config.ts' to be '' // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed (2)
```

## GREEN — after the fix

Restored the fix (deleted `tailwind.config.ts`, blanked `components.json`) and ran the
same test:

```
bun --bun vitest run src/utils/tailwind-config-convention.test.ts
```

```
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  16:16:40
   Duration  215ms
```

## Full gate

- `bun run build`: succeeded, client CSS bundle generated unchanged
  (`.output/public/assets/index-*.css`, 32.76 kB).
- `bun run verify` (lint + typecheck + full unit suite) with the new regression test
  included: 48 test files, 273 tests, 0 failed.
- `bun run test:e2e`: could not run — Playwright's Chromium is not installed in this
  container (preflight fails fast with a clear message). Per project convention, E2E
  runs in the QA/CI phase, not engineer containers; not retried, not installed here.

TDD-RESULT: 273 passed, 0 failed
