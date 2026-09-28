---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0002
ticket: SWHR3-T-0023
branch: vortex/sprint/swhr3-s-0002-74386212
upstream: [openspec/changes/swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t/design.md]
---

# Plan — SWHR3-T-0023: build/manifest.yaml change.dir paths point at openspec changes that do not exist

Change: `swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t`. Read its `design.md` first.

## Objective

Each of the ten `capabilities[].change.dir` values in `build/manifest.yaml` names a change directory that exists on the sprint branch, and nothing else in the file changes.

## Steps

1. Replace the ten `dir:` values using the table in design.md §D2. Match each entry on its `slug` (the file is not in `order` sequence). Note that `customer-management` takes the archive path (design.md §D1), not the path in the defect ticket's table.
2. Check that each of the ten new paths is an existing directory.
3. Check that the diff against the base commit contains only those ten `dir:` lines and that the file still parses as YAML.

## File/module ownership

- `build/manifest.yaml` (modify `dir:` lines only)

## Definition of Done

- AC-1, AC-2, AC-3 — from the ticket's acceptance criteria.
