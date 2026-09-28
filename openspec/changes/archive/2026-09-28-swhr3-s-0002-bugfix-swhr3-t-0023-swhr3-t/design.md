## Context

Both defects are static repository content. Reproduced on `vortex/sprint/swhr3-s-0002-74386212` (base `72d53d5`):

- `build/manifest.yaml` has ten `change.dir: openspec/changes/sx-<slug>` entries. `openspec/changes/` holds none of them. The manifest came from `vortex-spec-extraction` (program `sx-0001`) before spec intake created the real `swhr3-i-00NN-*` directories, and the placeholders were never back-filled. The archived S-0001 change recorded the same mismatch (its `design.md` SD21) and left it alone on purpose.
- `tailwind.config.ts` is 0 bytes and unchanged since the initial commit. `vite.config.ts` calls `tailwindcss()` without arguments, `src/index.css` imports Tailwind with `@import 'tailwindcss'`, and there is no `@config` directive. The only reference to the file is `components.json` (`tailwind.config`). `.vscode/settings.json` has a file-nesting glob, `tailwind.config.*`, which is an editor pattern rather than a reference and stays as is.

## Decisions

### D1 — customer-management points at the archive path

The defect ticket maps `customer-management` to `openspec/changes/swhr3-i-0002-customer-management-and-aut`. That directory no longer exists: sprint SWHR3-S-0001 archived it to `openspec/changes/archive/2026-09-23-swhr3-i-0002-customer-management-and-aut`. The fix points at the archived path, because the ticket's requirement is that "every `change.dir` names a directory that exists".

### D2 — Mapping is by `order`, taken from the real directory names

| slug (order)                 | new `change.dir`                                                               |
| ---------------------------- | ------------------------------------------------------------------------------ |
| customer-management (1)      | `openspec/changes/archive/2026-09-23-swhr3-i-0002-customer-management-and-aut` |
| order-approval (2)           | `openspec/changes/swhr3-i-0003-order-approval-and-status-m`                    |
| shopping-cart (3)            | `openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana`                    |
| order-checkout (4)           | `openspec/changes/swhr3-i-0005-order-checkout-and-payment`                     |
| order-workflow (5)           | `openspec/changes/swhr3-i-0006-order-processing-and-fulfil`                    |
| supplier-integration (6)     | `openspec/changes/swhr3-i-0007-supplier-portal-and-invento`                    |
| admin-dashboard (7)          | `openspec/changes/swhr3-i-0008-administrator-dashboard-and`                    |
| catalog-browsing (8)         | `openspec/changes/swhr3-i-0009-catalog-browsing-and-produc`                    |
| creditcard-validation (9)    | `openspec/changes/swhr3-i-0010-credit-card-data-storage-an`                    |
| customer-communications (10) | `openspec/changes/swhr3-i-0011-customer-communications-and`                    |

The manifest lists capabilities in file order 1, 2, 4, 5, 3, 6, 7, 8, 9, 10, not in `order` sequence. Match each entry on its `slug`, not on its position in the file. Edit only the `dir:` lines, so `specCapabilities`, `order`, `dependsOn`, `priority`, `canvas` and `evidence` stay byte-identical.

### D3 — Delete the file and blank the shadcn `tailwind.config`

For Tailwind v4 projects, shadcn/ui documents `"config": ""` (the empty string). Keep the key and blank its value. Deleting the key would diverge from the shape shadcn's `components.json` schema expects.

### D4 — No spec deltas

Neither fix changes behaviour the product exposes. The schema reserves `skip_specs` for tooling and config changes, so the change sets it rather than inventing a requirement.

## Risks

- The paths will go stale again when each remaining `swhr3-i-00NN` change is archived at its sprint close (see F1).

## Follow-ups / out of scope

- F1: Sprint-close archiving moves `openspec/changes/<id>` to `openspec/changes/archive/<date>-<id>` but does not rewrite `build/manifest.yaml`, so every `change.dir` goes stale again as its capability ships. Fix this in the platform's archive or land step (update `change.dir`, or key the manifest on the change id rather than a path). The repo cannot fix it. Planning cannot file tickets, so this is left for the next sprint.
- F2: `.vortex/agents-generated.md` needs no correction. The AGENTS.md line on CSS-first Tailwind becomes true once SWHR3-T-0024 lands.
