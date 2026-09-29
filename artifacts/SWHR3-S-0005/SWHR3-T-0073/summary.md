---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0073
---

# Summary — SWHR3-T-0073

Added the cart constants (`src/constants/cart.ts`, re-exported from `src/constants/index.ts`), the typed client `src/utils/cart-api.ts` (`getCart`, `addToCart`, `updateCart`, `removeFromCart`, `emptyCart`, each via `apiFetch`, itemId URL-encoded), and the `/checkout` guard page `src/pages/checkout.tsx`. An empty cart shows an `Alert` with `EMPTY_CART_CHECKOUT_MESSAGE` and a link to `/cart`, with no order entry; a populated cart shows an "Enter Order Information" heading placeholder (D10).

Files: `src/constants/cart.ts`, `src/constants/index.ts`, `src/utils/cart-api.ts(+test)`, `src/pages/checkout.tsx(+test)`.

Design: the idea carries no design blocks (PLAN.md says so); the page uses existing `Alert` primitives and tokens. Beyond the plan, the page also shows a "Your cart could not be loaded." alert if `getCart` fails, and an empty busy `main` while loading.

AC coverage: AC-1 by `[SWHR3-C-0091]`.

Verification: `bun run verify` exit 0 (548 tests); `bun run build` exit 0.
