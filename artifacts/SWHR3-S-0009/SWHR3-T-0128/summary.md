# SWHR3-T-0128 summary

- `lib/roles.ts`: `AccountRole` gains `supplier`; `getAccountRole` returns it.
- `lib/protected-resources.ts`: `SUPPLIER_API_PREFIX` and `isSupplierApiPath`.
- `middleware/auth.ts`: `/api/supplier/` answers 401 with no session (same messages as admin) and 403 FORBIDDEN "Supplier administrator credentials required" unless the fresh db role is `supplier`, so store administrators are refused. Admin and customer rules unchanged.
- `db/grant-supplier.ts` + `supplier:grant` in `package.json`, mirroring `admin:grant`. Only the unknown-user path was run (exits 1 with a message); the grant path is a copy of `grant-admin.ts` with a different role.
- Tests: `lib/roles.test.ts`, `lib/protected-resources.test.ts`, `middleware/auth.test.ts`.

Design: none applies here; the sign-in mockup belongs to a UI ticket, this ticket has no visible change.

AC coverage: "administrator role enforced, access denied without it" -> SWHR3-C-0224, C-0225.

Verification: `bun run verify` exit 0 (864 tests passed).
