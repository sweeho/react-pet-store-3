---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0144
---

# Summary — SWHR3-T-0144

- `src/constants/supplier.ts` (`SUPPLIER_HOME`, `SUPPLIER_SIGNIN`, `SUPPLIER_ROLE_LABEL`), `src/types/supplier.ts` (`InventoryRow`, `InventoryUpdateResult`) with a type-level parity test (`lib/supplier-mirror.test.ts`), and both files added to `tsconfig.node.json`'s include.
- `src/utils/supplier-api.ts`: `getInventory()`, `updateInventory(fields)` and `signOutSupplier()`, all through `apiFetch`.
- `src/components/supplier/supplier-shell.tsx`: masthead "Pet Store Supplier", user name, the "Supplier administrator" label (only for an account with the role) and Sign out (back to `/supplier/signin`).
- `src/components/supplier/require-supplier.tsx`: `RequireSupplier` (signed out to `/supplier/signin?redirect=…`; any signed-in non-supplier sees the access-denied panel inside the shell, never the children) and the `AccessDenied` panel with "Sign in as a different user" (signs out, goes to `/supplier/signin`).
- `src/pages/supplier/signin.tsx`: the mockup's sign-in form; after sign-in it re-reads `GET /api/session` and sends a supplier to the redirect target (default `/supplier`, off-site targets ignored) while anyone else sees the access-denied content.

Ownership note: `src/hooks/use-session.ts` is outside this ticket's list, but its `SessionUser.role` type only allowed `"customer" | "admin"`, so the supplier checks would not typecheck. I widened it by one literal (`| "supplier"`); no runtime change.

Design: built the sign-in and access-denied mockups (`mockup-supplier-sign-in.html`, `mockup-inventory-access-denied.html`) from existing primitives and tokens, with the `lucide-react` paw icon standing in for the mockups' brand mark and a shield icon for the denied panel; the note icon in the denied panel is not reproduced. Not viewed in a browser. The inventory page itself is a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0187]`.

Verification: `bun run verify` exit 0 (987 tests), `bun run build` exit 0. E2E not run (no Chromium).
