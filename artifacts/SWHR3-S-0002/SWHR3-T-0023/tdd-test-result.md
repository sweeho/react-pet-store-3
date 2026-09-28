---
artifact: tdd-test-result
spec: 1
status: complete
author_role: devops
sprint: SWHR3-S-0002
ticket: SWHR3-T-0023
---

# TDD result — SWHR3-T-0023

Test file: `src/utils/manifest-change-dirs.test.ts`

## RED — before the fix

Ran the new test against the unmodified `build/manifest.yaml` (fix stashed):

```
bun --bun vitest run src/utils/manifest-change-dirs.test.ts
```

```
 ❯ |client| src/utils/manifest-change-dirs.test.ts (3 tests | 2 failed) 5ms
     × never points at the openspec/changes/sx- placeholder paths 2ms
     × names a directory that actually exists on disk 0ms

 FAIL  |client| src/utils/manifest-change-dirs.test.ts > build/manifest.yaml change.dir paths > never points at the openspec/changes/sx- placeholder paths
AssertionError: expected true to be false // Object.is equality

 FAIL  |client| src/utils/manifest-change-dirs.test.ts > build/manifest.yaml change.dir paths > names a directory that actually exists on disk
AssertionError: expected false to be true // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
```

## GREEN — after the fix

Ran the same test with the ten `dir:` corrections applied:

```
bun --bun vitest run src/utils/manifest-change-dirs.test.ts
```

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  16:12:20
   Duration  219ms
```

## Full gate

`bun run verify` after the fix, with the new regression test included: lint, typecheck,
and the full unit suite all passed (47 test files, 271 tests, 0 failed).

TDD-RESULT: 271 passed, 0 failed
