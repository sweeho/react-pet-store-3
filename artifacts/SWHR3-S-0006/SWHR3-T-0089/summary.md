# Summary — SWHR3-T-0089

Added `getCheckoutLines(cartToken, locale, tx)` in `lib/checkout-cart.ts` (C7): returns `getItems(cartToken, locale, tx)` and throws the existing `ShoppingCartEmptyError` (C5, 409, "Shopping cart is empty") when the result is empty.

Files: `lib/checkout-cart.ts`, `lib/checkout-cart.test.ts` (C-0115 = AC-1, plus an insertion-order case). No UI change, so no design consulted.

Verification: red run 2 failed against the stub; `bun run verify` exit 0, 572 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
