---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0003
ticket: SWHR3-T-0047
branch: vortex/sprint/swhr3-s-0003-21038629
upstream: [openspec/changes/swhr3-i-0003-order-approval-and-status-m/design.md]
downstream: [artifacts/SWHR3-S-0003/SWHR3-T-0047/tdd-test-result.md]
---

# Plan — SWHR3-T-0047: Testing and Validation — order-approval E2E journey, seed script and archive-safe manifest test

Change: `swhr3-i-0003-order-approval-and-status-m`. Read its `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0003)" down: the decisions (D), contracts (C) and spec discrepancies (SD) cited below live there.

## Objective

One Playwright spec proves the order-approval capability end to end against the real server, repeatably and in parallel, and the manifest regression test survives this sprint's own archive step.

## Steps

1. Create `db/seed-orders.ts`: arguments `--username <name> --count <n>` (optional `--status`), inserts orders with `totalCents` ≥ 50000 for that account, prints `{ "orderIds": [...] }` (`design.md` D12).
2. Create `e2e/order-approval.spec.ts` (copy the unique-name helper from `e2e/customer-auth.spec.ts`): register accounts through the API, promote one by spawning `bun db/grant-admin.ts <name>` and seed by spawning `bun db/seed-orders.ts` (the runner cannot load `bun:sqlite`); address rows only by returned ids (R1). Cover the ticket's criteria in separate tests.
3. For the failed-commit test, stage decisions, then change one of those orders out of PENDING behind the page (spawn the seed script's `--status` update or commit it through the API as the admin), then commit from the page.
4. Update `src/utils/manifest-change-dirs.test.ts` so a `change.dir` also passes when `openspec/changes/archive/<YYYY-MM-DD>-<basename>` exists (Phase 7), keeping the placeholder check.
5. Run the new spec at least once before committing it.

## File/module ownership

- `db/seed-orders.ts`
- `e2e/order-approval.spec.ts`
- `src/utils/manifest-change-dirs.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

All screens under `artifacts/SWHR3-S-0003/design/` — the spec drives the admin home, pending queue, commit dialog, refresh warning and sign-in-required flows. Index: `artifacts/SWHR3-S-0003/design/MANIFEST.md`.

## Definition of Done

- AC-1
- AC-2
- AC-3
- AC-4
- AC-5
- AC-6 — the ticket's acceptance criteria, each proven by a test named for it.
