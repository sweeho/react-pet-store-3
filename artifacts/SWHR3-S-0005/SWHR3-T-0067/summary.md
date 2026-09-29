# Summary — SWHR3-T-0067

Added the server `CartItem` value object and the client `CartView`/`CartLine` mirror.

- `lib/cart-item.ts`: `CartItem`, `CartLine`, `CartView`, `createCartItem`, `cartItemTotalCostCents`, `cartItemUnitCost`, `cartItemTotalCost` (C3, C9). `CatalogItem` is declared here per PLAN step 1 because `lib/catalog.ts` does not exist yet; SWHR3-T-0071 moves it.
- `lib/cart-item.test.ts`: covers C-0083 (AC-1) and C-0084 (AC-2).
- `src/types/cart.ts`, `src/types/index.ts`: client mirror and re-export (index.ts was empty).

Verification: `bun run verify` exit 0, 459 tests passed. Red run confirmed with 2 stub failures. `a2a_run_tests` refused (no testEvidence block).
