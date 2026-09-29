# Summary — SWHR3-T-0069

HTTP requests now become `CartAction`s and the five `/api/cart` routes answer with the full `CartView`.

- `lib/cart-request.ts`: `ITEM_QUANTITY_FIELD_PREFIX`, `parseQuantity` (integer or whole-number string, else 0), `parseAddRequest`, `parseRemoveRequest`, `parseUpdateRequest`, and blank itemId -> `ValidationError({ itemId })` (C6). Also `buildCartView` and `applyRequestAction` (token guard, `applyCartAction`, view), so the routes stay a few lines each.
- `routes/api/cart/`: `index.get.ts` (empty view without cookie, no cookie minted), `index.post.ts` (`getItem` first, 404 for unknown item), `index.put.ts`, `[itemId].delete.ts`, `index.delete.ts`. Errors go through `toHttpError`.
- Tests: `lib/cart-request.test.ts` and one `*.test.ts` per route, run through `middleware/cart-session`.

AC coverage: AC-1 add (C-0085, C-0086), AC-2 remove (C-0087, C-0062), AC-3 update (C-0088, C-0051), AC-4 non-numeric quantity to 0 (C-0089). C-0053, C-0056, C-0058 and C-0075 covered at route level.

Deviation: `buildCartView` and `applyRequestAction` live in `lib/cart-request.ts` (in this ticket's ownership) rather than a new file; a non-test helper under `routes/` would be registered as a route.

Verification: red run 28 failed against stubs; `bun run verify` exit 0, 523 tests passed; `bun run build` exit 0. `a2a_run_tests` not used: the project has no testEvidence block.
