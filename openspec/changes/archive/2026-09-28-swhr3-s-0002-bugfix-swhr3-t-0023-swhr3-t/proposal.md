## Why

Two repository-content defects left the build metadata and tooling config out of step with the repository. SWHR3-T-0023: every `capabilities[].change.dir` in `build/manifest.yaml` names an `openspec/changes/sx-<slug>` directory that has never existed, so nothing can find a capability's change from the manifest. SWHR3-T-0024: a zero-byte `tailwind.config.ts` sits at the repo root even though the project is Tailwind v4 CSS-first and its own docs say no such file exists. `components.json` still names that file for the shadcn CLI.

## What Changes

- `build/manifest.yaml`: each of the ten `change.dir` values points at the change directory that exists today. Nine are active `openspec/changes/swhr3-i-00NN-*` directories. `customer-management` points at its archived directory, because sprint SWHR3-S-0001 archived `swhr3-i-0002` (see `design.md` D1). No other manifest field changes.
- `tailwind.config.ts` is deleted.
- `components.json`: `tailwind.config` becomes the empty string, which is the shadcn/ui value for Tailwind v4 CSS-first projects (see `design.md` D3).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No product behaviour changes, so there are no spec deltas and `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Files: `build/manifest.yaml`, `tailwind.config.ts` (deleted), `components.json`.
- No runtime, API, data or UI change. Rendered styles are unchanged, because the build never read `tailwind.config.ts`.
- Nothing in the repo reads `build/manifest.yaml` at runtime. Its consumers are platform spec-intake tooling outside this repository.
