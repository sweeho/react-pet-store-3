---
artifact: fix-note
spec: 1
status: complete
author_role: devops
sprint: SWHR3-S-0002
ticket: SWHR3-T-0023
---

# Fix note — SWHR3-T-0023

## Root cause

All ten `capabilities[].change.dir` values in `build/manifest.yaml` still held the
`openspec/changes/sx-<slug>` placeholder paths written by spec extraction. Spec intake
later created the real `swhr3-i-00NN-*` change directories, but nobody back-filled the
manifest's `dir:` fields, so every one pointed at a directory that never existed.
Re-verification (design.md D1) also found that `swhr3-i-0002` (customer-management) was
archived at the SWHR3-S-0001 sprint close, moving to
`openspec/changes/archive/2026-09-23-swhr3-i-0002-customer-management-and-aut` — a path
different from the one in the original triage table.

## Fix

Repointed each of the ten `dir:` lines in `build/manifest.yaml` at the change directory
that actually exists on disk, matched by `slug` (the file is not in `order` sequence).
No other field (`slug`, `order`, `dependsOn`, `priority`, `specCapabilities`, `canvas`,
`evidence`) was touched.

## Files touched

- `build/manifest.yaml` — ten `dir:` values corrected.
- `src/utils/manifest-change-dirs.test.ts` — new regression test asserting every
  `change.dir` in the manifest resolves to an existing directory and none is a
  `openspec/changes/sx-` placeholder.
