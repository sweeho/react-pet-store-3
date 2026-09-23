---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0001
ticket: SWHR3-T-0019
branch: vortex/feat/SWHR3-T-0019-13-app-error-screen-and-exception-to-scr-e1429816
upstream: [artifacts/SWHR3-S-0001/SWHR3-T-0019/PLAN.md]
downstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Summary — SWHR3-T-0019: App error screen and exception-to-screen mapping

## What changed

Added `src/utils/error-screen.ts`'s `getErrorScreen(error)` (C16) mapping an `ApiError` to `signin`/`error` plus a message. Added `src/components/error-boundary.tsx`'s `AppErrorBoundary`, a class-component error boundary that logs a caught render error once and shows the restyled `src/pages/RootErrorBoundary.tsx` (now built from `mockup-error-screen.html`) instead of a blank page. Wired it into `src/main.tsx` around `RequireAuth`, with `createRoot`'s `onCaughtError` suppressed so React's own default logging doesn't double the single `console.error`.

## Files

- `src/utils/error-screen.ts` (+ test) — `getErrorScreen`, the three mappings.
- `src/components/error-boundary.tsx` (+ test) — `AppErrorBoundary`: `componentDidCatch` logs once; resets on a pathname change via a `key`-remounted inner class component.
- `src/pages/RootErrorBoundary.tsx` — restyled to the mockup: heading, body copy, "Back to the store" (`/`) / "Sign in again" (`/signin`) links, a `<details>` Technical detail section (message via `getErrorScreen`).
- `src/main.tsx` — wraps `<RequireAuth>` in `<AppErrorBoundary>`; `createRoot` gets `onCaughtError: () => {}`.

## AC coverage

- AC-1/AC-2 (jspException/screen-name mapping, legacy terms) — met through design.md's SD12 interpretation: `AppErrorBoundary` catches the render error and passes it to `RootErrorBoundary`; `getErrorScreen(error)` is the screen-name-mapping equivalent. No JSP/servlet artifact exists to port.
- AC-3 (interface contract: `getErrorScreen` shape, `AppErrorBoundary`, `main.tsx` renders routes inside it) — see Files; `error-screen.test.ts` pins the return shape, `error-boundary.test.tsx` renders `AppErrorBoundary` directly.
- AC-4 (render error → designed error screen, not a blank page) — `error-boundary.test.tsx › shows the error screen instead of a blank page when a child throws` (heading, both links, Technical detail all asserted).
- AC-5 (logged once) — `error-boundary.test.tsx › logs the caught error to the console exactly once`.
- AC-6 (`getErrorScreen` mappings: 401 → signin, 409/DUPLICATE_ACCOUNT → friendly message, else → error) — all 5 `error-screen.test.ts` cases.

## Verification

```
$ NODE_ENV=test bun --bun vitest run src/utils/error-screen.test.ts src/components/error-boundary.test.tsx
Test Files  2 passed (2)
     Tests  8 passed (8)

$ bun run verify        # lint && typecheck && full unit/integration suite
Test Files  38 passed (38)
     Tests  224 passed (224)

$ bun run verify:full   # verify + e2e
Chromium not installed in this container; preflight instructs falling back to `verify`
(E2E runs in the QA phase / CI, per AGENTS.md). `verify` portion above was green.
```

See `tdd-test-result.md` — `TDD-RESULT: 224 passed, 0 failed`. Red runs: new files confirmed by module-not-found; `RootErrorBoundary.tsx` (rewrite) confirmed by resetting to its pre-ticket `HEAD` content and re-running `error-boundary.test.tsx` against it (rendered the old "Error" / generic copy instead of the mockup's heading, 1/3 failed).

## Notes

- `getErrorScreen`'s `screen: "signin"` branch is not itself wired to a redirect in this ticket — `RootErrorBoundary` always renders the one mockup layout for any caught render error and uses only `getErrorScreen(error).message` for the Technical detail text. `screen` is part of the C16 contract for a caller that needs to choose between screens (e.g. a page-level `catch` of an `apiFetch` call), which is out of this ticket's file ownership.
- `createRoot`'s `onCaughtError: () => {}` in `src/main.tsx` is necessary, not decorative: React 19's `createRoot` default `onCaughtError` also calls `console.error` for any error an error boundary catches, which would make AC-5's "logged once" false in the real app (two calls) even though a naive test might only assert on `AppErrorBoundary`'s own call. `error-boundary.test.tsx` passes the same `onCaughtError` option to `render(...)` so the test observes exactly what production does.
- No design reference beyond `mockup-error-screen.html`/`wireframe-error-screen.html`, both read directly; per `design/MANIFEST.md` the top bar/category nav/footer shell is out of scope this sprint, so only the centered error card was built.
