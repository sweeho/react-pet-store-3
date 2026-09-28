---
artifact: fix-note
spec: 1
status: complete
author_role: devops
sprint: SWHR3-S-0002
ticket: SWHR3-T-0024
---

# Fix note — SWHR3-T-0024

## Root cause

`tailwind.config.ts` was a zero-byte file left over from the initial commit. Nothing
wires it into the build: `vite.config.ts` calls `tailwindcss()` with no arguments, and
`src/index.css` imports Tailwind via CSS (`@import 'tailwindcss';`) with no `@config`
directive — both are the CSS-first Tailwind v4 pattern. The file's only reference was
the shadcn CLI key `components.json` → `tailwind.config`, which still named a file the
project no longer uses, contradicting the documented CSS-first convention
(design.md Context, D3).

## Fix

- Deleted `tailwind.config.ts`.
- Set `components.json`'s `tailwind.config` to `""` — the value shadcn/ui documents for
  Tailwind v4 projects — keeping the key present (per design.md D3: blanking, not
  removing, keeps the shape shadcn's schema expects) and leaving every other key
  (`tailwind.css`, `baseColor`, `cssVariables`, `prefix`, `style`, `rsc`, `tsx`,
  `aliases`, `iconLibrary`) untouched.
- `vite.config.ts` and `src/index.css` were not touched — they already had no reference
  to the file.

## Files touched

- `tailwind.config.ts` — deleted.
- `components.json` — `tailwind.config` changed from `"tailwind.config.ts"` to `""`.
- `src/utils/tailwind-config-convention.test.ts` — new regression test asserting no
  `tailwind.config.*` file exists at the repo root and `components.json`'s `tailwind.config`
  stays blank.

## Verification

- `bun run build` succeeds; the client CSS bundle is still generated
  (`.output/public/assets/index-*.css`, 32.76 kB), confirming Tailwind styling compiles
  unchanged without the config file.
- `bun run verify` (lint + typecheck + full unit suite): 48 test files, 273 tests, 0 failed.
- `bun run test:e2e` could not run in this container: Playwright's Chromium is not
  installed here (`bun x playwright install chromium` needed, agent-workflow policy is
  E2E runs in the QA/CI phase, not engineer containers). Per project convention this is
  a genuine "browser missing" case, not a regression — build output above is the
  available evidence that styling still applies as before.
