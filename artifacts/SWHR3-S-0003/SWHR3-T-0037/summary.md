---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0003
ticket: SWHR3-T-0037
branch: vortex/feat/SWHR3-T-0037-rich-client-ui-orders-approval-table-wit-86526e98
upstream: [artifacts/SWHR3-S-0003/SWHR3-T-0037/PLAN.md]
downstream: [artifacts/SWHR3-S-0003/qa-test-report.md]
---

# Summary — SWHR3-T-0037: Rich Client UI — Orders approval table with Table, Badge and Dialog primitives

## What changed

Added `Table`, `Badge` and `Dialog` primitives to `src/components/ui/` (DESIGN.md
§Components) and `OrdersTable` (`src/components/admin/orders-table.tsx`, design.md C12):
a fully controlled, sortable order queue whose editable mode stages APPROVED/DENIED
decisions through props/callbacks, following the pending-queue and decided-queue
mockups.

## Files

- `src/components/ui/table.tsx` (+ `table.test.tsx`) — new: styled native table parts.
- `src/components/ui/badge.tsx`, `badge-variants.ts` (+ `badge.test.tsx`) — new: 5-variant
  status label (pending/approved/denied/completed/staged).
- `src/components/ui/dialog.tsx` (+ `dialog.test.tsx`) — new: styled `@headlessui/react`
  `Dialog` wrapper.
- `src/components/ui/index.ts` — export the three new primitives.
- `src/components/admin/orders-table.tsx` (+ `orders-table.test.tsx`) — new: `OrdersTable`.

## AC coverage

- AC-1 (four status values available) — read-only rows render a `Badge` with the row's
  actual status text; covered by `[SWHR3-C-0025]`.
- AC-2 (single order → APPROVED) — covered by `[SWHR3-C-0004]`.
- AC-3 (multiple orders → DENIED in batch) — covered by `[SWHR3-C-0006]`.
- AC-4 (only APPROVED/DENIED offered) — the per-row `<select>` is built from
  `ASSIGNABLE_STATUSES`; covered by `[SWHR3-C-0024]`.
- AC-5 (C12 props; `editable=false` renders no checkbox/select/bulk controls) — covered by
  `[SWHR3-C-0025]` and the C12-contract-worded alias test.
- AC-6 (header sort + aria-sort; dollar formatting) — covered by `toggles
ascending/descending sort…` and `formats amounts as dollars…`.
- AC-7 (primitive pattern; own test per primitive; Dialog traps focus/closes on Escape) —
  `Badge`'s variants live in `badge-variants.ts` (cva, `cn()` last); each of `Table`,
  `Badge`, `Dialog` has its own `*.test.tsx`; Dialog's Escape/focus-trap behaviour is
  covered by the two matching `dialog.test.tsx` cases (Headless UI's `Dialog` supplies
  both natively — the wrapper only adds project styling).

## Verification

```
$ bun run test -- <4 new test files>   # red, every export a stub throwing VortexNotImplemented
Test Files  4 failed (4)
     Tests  21 failed (21)

$ bun run test -- <4 new test files>   # green, after implementing
Test Files  4 passed (4)
     Tests  21 passed (21)

$ bun run verify                        # full gate: lint + typecheck + full suite
Test Files  59 passed (59)
     Tests  355 passed (355)
```

See `tdd-test-result.md` — `TDD-RESULT: 355 passed, 0 failed`.

`bun run verify:full` was attempted but this container has no Chromium installed; the E2E
tier was not run here (this ticket adds no route or page, only components) and is covered
in Validation's browser-equipped container.

## Notes

- The mockup's per-row status control is a custom listbox with coloured dots and an inline
  note ("Only approved and denied can be set here."). `OrdersTable` uses the project's
  native-`<select>` convention instead (matching `src/components/ui/select.tsx` and
  DESIGN.md's "native elements styled with tokens only"), styled with a dashed border once
  staged. This keeps the control testable the same way the rest of the codebase's selects
  are and matches the mockup's layout/hierarchy without introducing a new custom listbox
  primitive that no other ticket asked for.
- A staged row's "staged" marker is a small `Staged` label next to the select rather than a
  `Badge(variant="staged")`, since the mockup conveys staging purely through the select's
  dashed border and row accent (no literal "staged" text anywhere in the design) — the
  `staged` badge variant still exists per DESIGN.md's inventory for a future consumer.
- `Approve selected`/`Deny selected` are no-ops when nothing is selected (guarded in the
  handler) rather than disabled buttons — the extracted mockup doesn't show a disabled
  state for them, and no acceptance criterion asked for one.
