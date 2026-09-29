---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0042
branch: vortex/feat/SWHR3-T-0042-uncommitted-changes-detection-refresh-co-58223642
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0042/PLAN.md]
---

# TDD result — SWHR3-T-0042

## Test cases

| Test                                                                                                                                                 | Covers                   | Intent                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `refresh-orders-control.test.tsx › [SWHR3-C-0010] reloads immediately and never opens the dialog when nothing is staged`                             | SWHR3-C-0010, AC-4       | no staged changes → `onRefresh` once, no dialog                   |
| `refresh-orders-control.test.tsx › [SWHR3-C-0009] opens a dialog naming the staged count and listing each change as id → status, without refreshing` | SWHR3-C-0009, AC-1, AC-5 | dialog title/body content, `onRefresh` not called                 |
| `refresh-orders-control.test.tsx › names every staged change in the dialog body (AC-5)`                                                              | AC-5                     | multiple staged rows all listed                                   |
| `refresh-orders-control.test.tsx › 'Cancel — keep my changes' closes the dialog without discarding or refreshing`                                    | AC-3                     | cancel: neither callback fires                                    |
| `refresh-orders-control.test.tsx › 'Refresh anyway' discards then refreshes and closes the dialog`                                                   | AC-2                     | confirm: both callbacks fire, dialog closes                       |
| `orders.test.tsx › [SWHR3-C-0010] Refresh reloads orders from the server immediately when nothing is staged`                                         | SWHR3-C-0010             | page-level: no dialog, immediate reload                           |
| `orders.test.tsx › [SWHR3-C-0012] cancelling the discard warning keeps staged decisions and makes no new request`                                    | SWHR3-C-0012, AC-3       | page-level: no new `GET /api/admin/orders`, staged rows unchanged |
| `orders.test.tsx › [SWHR3-C-0011] confirming the discard warning clears staging and reloads from the server`                                         | SWHR3-C-0011, AC-2       | page-level: staging cleared, reload reflects server state         |

All four platform-linked cases (`SWHR3-C-0009`, `SWHR3-C-0010`, `SWHR3-C-0011`, `SWHR3-C-0012`) are cited by key. `SWHR3-C-0009`/`SWHR3-C-0010` are unit-level and proven directly against `RefreshOrdersControl`. `SWHR3-C-0011`/`SWHR3-C-0012` are scenario-tagged `e2e` in the platform, but `PLAN.md` step 3 scopes this ticket's proof of them to "extend the page test with the same three cases" (Testing-Library, not Playwright) — `e2e/order-approval.spec.ts` itself is a different ticket's file (SWHR3-T-0047, "Testing and Validation", per `design.md`'s ticket map and phase 6), not owned here. `a2a_run_tests` refused to record red/green runs — "the sprint branch's `.vortex/config.yaml` has no `testEvidence` block, so this project records no red/green runs. Use the TDD-RESULT marker." — so their evidence is the marker below, same as every other test in this ticket.

## Red run

Committed the test files above plus a stub `RefreshOrdersControl` (`throw new Error("VortexNotImplemented")`) at commit `d1d0079`, with `src/pages/admin/orders.tsx` untouched (still rendering a plain Refresh button):

```
$ NODE_ENV=test bun --bun vitest run src/components/admin/refresh-orders-control.test.tsx
 Test Files  1 failed (1)
      Tests  5 failed (5)   # all 5, on the VortexNotImplemented sentinel

$ NODE_ENV=test bun --bun vitest run src/pages/admin/orders.test.tsx
 Test Files  1 failed (1)
      Tests  2 failed | 7 passed (9)   # the 2 new dialog-flow tests fail — no dialog ever
                                        # opens against the unmodified page; the other 7,
                                        # unaffected by this ticket, still pass
```

## Green run

`bun run verify` — this stack's full gate (lint + typecheck + complete unit suite):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  71 passed (71)
      Tests  438 passed (438)
```

`bun run verify:full` (adds the E2E tier) was attempted; its preflight reports Chromium is not
installed in this container (`[test:e2e] Playwright's Chromium browser is not installed`) and
explicitly directs engineer containers to `bun run verify` instead, deferring E2E to the
QA-phase/CI containers.

**Manual browser verification was partially possible in this container.** `bun run dev` (the
project's declared `start` command) itself fails here with `ERR_UNSUPPORTED_ESM_URL_SCHEME` on a
`bun:` import inside Nitro's dev sub-process — the same underlying cause AGENTS.md already
documents for `test` (Vitest's worker pool spawning plain-Node children), just not yet documented
for `dev`. `bun --bun run dev` avoids it; fixed the gotcha into AGENTS.md's Build & run section
(pre-existing to this container, unrelated to any file this ticket owns —
`server.ts`/`vite.config.ts` are untouched). With that, the dev server serves `/admin/orders`'s SPA
shell at `curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/admin/orders` → `200`,
confirming no server-side crash on this route. Playwright still has no Chromium in this container
to render and interact with the page, so pixel-level visual verification was not possible; the
Testing Library suite (14 tests across the two files, asserting the dialog's exact title/body/
button text and DOM structure against `design.md` D11's copy) is the verification evidence in
place of a screenshot.

TDD-RESULT: 438 passed, 0 failed
