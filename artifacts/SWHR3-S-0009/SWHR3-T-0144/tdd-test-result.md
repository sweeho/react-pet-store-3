---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0144
---

# TDD result — SWHR3-T-0144

## Test cases

`src/components/supplier/require-supplier.test.tsx` (mocks `fetch` for `/api/session` and sign-out): SWHR3-C-0187 — no session redirects to `/supplier/signin?redirect=%2Fsupplier` and shows no inventory; a customer and an admin each see "Access denied", the two explanation paragraphs and "Sign in as a different user", and never the inventory; also a supplier reaches the children, the loading fallback, and "Sign in as a different user" signs out and goes to `/supplier/signin`.

`src/pages/supplier/signin.test.tsx`: the mockup's sign-in form ("Pet Store Supplier", "Sign in to manage inventory.", Username, Password, Sign in, the issuing note); a supplier who signs in lands on `/supplier` or the redirect target; a customer or admin who signs in sees Access denied; sign-in failure alert clears the password; an off-site redirect is ignored; an already signed-in supplier is forwarded.

`src/components/supplier/supplier-shell.test.tsx`: brand, user name, "Supplier administrator" label only for a supplier, Sign out (posts sign-out, goes to the supplier sign-in). `src/utils/supplier-api.test.ts`: `getInventory`, `updateInventory` (flat body, POST), 403 as `ApiError`, `signOutSupplier`. `lib/supplier-mirror.test.ts`: client `InventoryRow` and the server's are mutually assignable, and the portal paths sit under the server's supplier prefix.

## Red run

`bun run test` over those files with the components, page and API binding as `VortexNotImplemented` stubs (constants and types already real): 20 failed, 2 passed (the two mirror tests, which test real files). `a2a_run_tests` is refused on this project (no testEvidence block).

## Green run

`bun run verify` (lint + typecheck + full unit suite), exit 0: 142 files, 987 tests passed. `bun run build` exit 0. No browser run (no Chromium in this container).

TDD-RESULT: 987 passed, 0 failed
