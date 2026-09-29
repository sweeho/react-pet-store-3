---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0037
branch: vortex/feat/SWHR3-T-0037-rich-client-ui-orders-approval-table-wit-86526e98
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0037/PLAN.md]
---

# TDD result — SWHR3-T-0037

`a2a_run_tests` was called first, per the ticket's linked-case instructions, and refused
the same way it did for SWHR3-T-0040: no `testEvidence` block on this project, "Use the
TDD-RESULT marker." This file follows that fallback.

## Test cases

| Test                                                                                                                                                                            | Covers           | Intent                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `src/components/ui/table.test.tsx › Table › renders a native table with header and body rows`                                                                                   | AC-6             | `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell` compose into a real `<table>` |
| `src/components/ui/table.test.tsx › Table › forwards a caller's aria-sort to the underlying header cell`                                                                        | AC-6             | `TableHead` passes through `aria-sort` for the caller (OrdersTable) to drive                       |
| `src/components/ui/table.test.tsx › Table › merges a caller's className with its own styling`                                                                                   | AC-6             | `cn()` merge pattern                                                                               |
| `src/components/ui/badge.test.tsx › Badge › renders its label`                                                                                                                  | AC-1, AC-6       | renders children                                                                                   |
| `src/components/ui/badge.test.tsx › Badge › applies the {variant} variant's classes` (×5)                                                                                       | AC-1, AC-6       | all five cva variants (pending/approved/denied/completed/staged) apply a class                     |
| `src/components/ui/badge.test.tsx › Badge › merges a caller's className with its own`                                                                                           | AC-6             | `cn()` merge pattern                                                                               |
| `src/components/ui/dialog.test.tsx › Dialog › renders its content when open`                                                                                                    | AC-6             | headlessui-backed modal renders                                                                    |
| `src/components/ui/dialog.test.tsx › Dialog › renders nothing when closed`                                                                                                      | AC-6             | `open={false}` renders nothing                                                                     |
| `src/components/ui/dialog.test.tsx › Dialog › calls onClose when Escape is pressed`                                                                                             | AC-6             | closes on Escape                                                                                   |
| `src/components/ui/dialog.test.tsx › Dialog › traps focus inside the panel: tabbing from the last control returns to the first`                                                 | AC-6             | focus trap                                                                                         |
| `src/components/admin/orders-table.test.tsx › OrdersTable › [SWHR3-C-0004] approving one selected pending row stages it as APPROVED`                                            | AC-2             | tick row 1001, click Approve selected → 1001 staged APPROVED, 1002/1003 untouched                  |
| `src/components/admin/orders-table.test.tsx › OrdersTable › [SWHR3-C-0006] denying several selected rows stages each as DENIED`                                                 | AC-3             | tick 1001/1002/1004, click Deny selected → all three staged DENIED, 1003 untouched                 |
| `src/components/admin/orders-table.test.tsx › OrdersTable › [SWHR3-C-0024] the row status select offers only APPROVED and DENIED`                                               | AC-4             | row select's visible options exclude PENDING/COMPLETED                                             |
| `src/components/admin/orders-table.test.tsx › OrdersTable › [SWHR3-C-0025] a read-only (editable=false) table renders no checkbox, select or bulk controls`                     | AC-1, AC-4, AC-5 | `editable=false` hides every editing control; status shown as `Badge`                              |
| `src/components/admin/orders-table.test.tsx › OrdersTable › contract C12: editable=false renders no checkboxes, status select or Approve/Deny controls (alias of SWHR3-C-0025)` | AC-5             | contract wording covered directly                                                                  |
| `src/components/admin/orders-table.test.tsx › OrdersTable › toggles ascending/descending sort through onSortChange and exposes it via aria-sort`                                | AC-6             | clicking a header calls `onSortChange`; `aria-sort` reflects the current column/direction          |
| `src/components/admin/orders-table.test.tsx › OrdersTable › formats amounts as dollars with two decimals from totalCents`                                                       | AC-6             | `124500` → `$1,245.00`, `50` → `$0.50`                                                             |

`SWHR3-C-0004`/`SWHR3-C-0006` render `OrdersTable` wired to the real `useStagedDecisions`
hook (an `EditableHarness` test component), per their stated preconditions.

## Red run

`bun run test -- src/components/ui/table.test.tsx src/components/ui/badge.test.tsx src/components/ui/dialog.test.tsx src/components/admin/orders-table.test.tsx`,
with every new component a stub throwing `VortexNotImplemented`.

```
FAIL  |client| src/components/ui/badge.test.tsx > Badge > renders its label
Error: VortexNotImplemented
 ❯ Badge src/components/ui/badge.tsx:2:3
...
FAIL  |client| src/components/admin/orders-table.test.tsx > OrdersTable > [SWHR3-C-0004] ...
Error: VortexNotImplemented
 ❯ OrdersTable src/components/admin/orders-table.tsx:22:3
...
 Test Files  4 failed (4)
      Tests  21 failed (21)
```

All 21 tests failed on the sentinel (not a compile error), reproducing the expected red.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck
&& bun run test`), after implementing `Table`, `Badge`, `Dialog` and `OrdersTable`:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  59 passed (59)
      Tests  355 passed (355)
```

`bun run verify:full` (adds the E2E tier) was attempted, same as SWHR3-T-0040: this
container has no Chromium installed (`ensure-playwright-browser.mjs`). Not retried, no
browser installed here — E2E runs in Validation's browser-equipped container. `bun run
verify` above is green with zero new failures (355/355, up from 314 at the last ticket's
baseline plus this ticket's 21 new tests, no regressions).

TDD-RESULT: 355 passed, 0 failed
