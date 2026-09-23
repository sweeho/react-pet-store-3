---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0020
branch: vortex/feat/SWHR3-T-0020-14-auth-configuration-and-the-lib-server-b959446e
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0020/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0020: Auth configuration and the lib/ server-module harness

## What changed

Added `lib/auth-config.ts` as the single source of form-based auth settings (C1) plus
`getSessionSecret()`, mirrored the client-safe subset in `src/constants/auth.ts`, and wired the new
`lib/` directory into the type-check and Vitest server project alongside `routes/` and `middleware/`.

## Files

- `lib/auth-config.ts` — new: `AUTH_CONFIG` and `getSessionSecret()`.
- `lib/auth-config.test.ts` — new: config values, the three `getSessionSecret` env branches, and
  parity against `src/constants/auth.ts`.
- `src/constants/auth.ts` — new: client-safe mirror (paths, username/password rules, remember-cookie
  name).
- `tsconfig.node.json` — added `lib` to `include`, plus the single file `src/constants/auth.ts` so the
  parity test in `lib/auth-config.test.ts` type-checks under the composite `--build` project.
- `vitest.config.ts` — added `lib/**/*.test.ts` and `middleware/**/*.test.ts` to the server project's
  `include`, and `lib/**`/`middleware/**` to the client project's `exclude`.
- `.env.example` — new: documents `SESSION_SECRET`.
- `doc/DEPLOYMENT.md` — added a `SESSION_SECRET` line to the sample `.env` and a note that it is
  required in production.

## AC coverage

- AC-1 — form-based auth (`authMethod: "FORM"`, sign-in/error pages): `lib/auth-config.ts`, covered by
  `AUTH_CONFIG › configures form-based auth with the sign-in and error pages`.
- AC-2 — full `AUTH_CONFIG` shape (C1) and the `src/constants/auth.ts` mirror: covered by the three
  remaining `AUTH_CONFIG` test cases and `mirrors the client-safe values in src/constants/auth.ts`.
- AC-3 — `getSessionSecret()` env/production behaviour: covered by the three `getSessionSecret` test
  cases.
- AC-4 — `lib/` type-checked under `tsconfig.node.json` and `*.test.ts` runs in the server Vitest
  project: `tsconfig.node.json`/`vitest.config.ts` changes above, verified by the green run (`lib`
  test file ran under the `|server|` project, `bun run typecheck` green).
- AC-5 — `.env.example` documents `SESSION_SECRET`; `doc/DEPLOYMENT.md` states it is required in
  production: files above.

## Verification

```
$ NODE_ENV=test bun --bun vitest run lib/auth-config.test.ts   # red, before implementation
Error: Cannot find module './auth-config' ...
$ bun run verify                                                # green, after implementation
Test Files  8 passed (8)
     Tests  27 passed (27)
$ node scripts/check-doc-links.mjs
doc-links: 54 file(s) checked, all relative links resolve
```

`bun run verify:full`'s E2E tier could not run — Chromium is not installed in this container
(documented AGENTS.md fallback: E2E runs in QA/CI). See `tdd-test-result.md` for the full red/green
detail.

## Notes

`lib/auth-config.test.ts` imports `src/constants/auth.ts` for the parity check the PLAN asks for.
Under `tsc --build`'s composite mode a file reachable only by import must also be in the project's own
`include`, so `tsconfig.node.json` lists `src/constants/auth.ts` explicitly (not the whole `src`
folder) — this is a type-check-only addition; it does not let `lib/` runtime code import from `src/`
and does not change the D13 rule that `src/` cannot import from `lib/`.
