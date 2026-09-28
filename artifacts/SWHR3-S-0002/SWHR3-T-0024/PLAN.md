---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0002
ticket: SWHR3-T-0024
branch: vortex/sprint/swhr3-s-0002-74386212
upstream: [openspec/changes/swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t/design.md]
---

# Plan — SWHR3-T-0024: Empty tailwind.config.ts contradicts the CSS-first Tailwind convention

Change: `swhr3-s-0002-bugfix-swhr3-t-0023-swhr3-t`. Read its `design.md` first.

## Objective

No `tailwind.config.*` file exists at the repo root, `components.json` no longer names a file that does not exist, and the app builds and renders exactly as before.

## Steps

1. Delete `tailwind.config.ts`. Nothing imports it (design.md §Context).
2. In `components.json`, set `tailwind.config` to the empty string and keep the key (design.md §D3).
3. Leave `vite.config.ts`, `src/index.css` and `.vscode/settings.json` untouched.
4. Run the full project gate. The existing smoke/E2E tier covers the "renders unchanged" outcome.

## File/module ownership

- `tailwind.config.ts` (delete)
- `components.json` (modify `tailwind.config` only)

## Definition of Done

- AC-1, AC-2, AC-3 — from the ticket's acceptance criteria.
