# Summary — SWHR3-T-0072

`/cart` renders the shopper's cart from `GET /api/cart`.

- `src/components/cart/cart-table.tsx`: presentational table (name, attribute, `itemQuantity_<itemId>` text input with maxLength 10, unit price, line total, Remove button, last-row subtotal), USD formatting over cents / 100 (D6). Exports `QUANTITY_FIELD_PREFIX`.
- `src/pages/cart.tsx`: loads with `getCart`; `count === 0` shows `EMPTY_CART_MESSAGE` and no table or Update Cart; otherwise a form with the table, Update Cart (collects every `itemQuantity_*` field from `FormData`, one `updateCart` call), and a Check Out link to `CHECKOUT_PATH`. Every response replaces state (D9). Load and update failures show an Alert.
- Tests: `cart-table.test.tsx`, `cart.test.tsx` cover all eight linked cases (AC-1..AC-8).

No design blocks exist for this idea; the layout follows the primitives and `orders-table.tsx` conventions, fixed-width desktop. Quantity inputs remount by `itemId-quantity` key so an update response resets them.

Verification: red run 13 failed against stubs; `bun run verify` exit 0, 561 tests passed; `bun run build` exit 0. E2E not run (no cart E2E in this ticket's ownership). `a2a_run_tests` not used: the project has no testEvidence block.
