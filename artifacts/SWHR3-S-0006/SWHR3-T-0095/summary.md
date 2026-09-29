---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0095
---

# Summary — SWHR3-T-0095

- `routes/api/orders/index.post.ts`: `POST /api/orders`. Account from the session (`requireSessionUser`), cart from `event.context.cartSession`, locale from `resolveCartLocale`; `parseCheckoutRequest` then `placeOrder`; 201 `{ orderId, orderDate, email }`; errors through `toHttpError`.
- Protection: `/api/orders` in `PROTECTED_API_PATHS`, `/checkout` in `PROTECTED_PAGE_PATHS`.
- `middleware/cart-session.ts`: resolves the cookie for `/api/orders*` too, and mints one only for `/api/cart*` writes (D8).
- Client: `src/types/checkout.ts` (C10 mirror), `src/constants/checkout.ts` (`ORDER_CONFIRMATION_PATH`), `src/utils/orders-api.ts` (`placeOrder`, `getOrder`); `payment-fields.tsx` now imports the card types from the mirror (import line only).
- `e2e/cart.spec.ts`: the `[SWHR3-C-0090]` and `[SWHR3-C-0092]` tests register (which signs in) before visiting `/checkout`; assertions unchanged.

Deviations (minor): the mirror-parity test is `lib/checkout-mirror.test.ts` (as `customer-profile` does), and `tsconfig.node.json` lists `src/types/cart.ts` and `src/types/checkout.ts` so that test typechecks (same precedent as `src/types/customer-profile.ts`). Added `src/constants/protected-pages.test.ts` because none existed.

Design: none applies (PLAN.md: no user-visible change beyond `/checkout` now requiring sign-in).

AC coverage: AC-1 by `[SWHR3-C-0131]`; the other six linked cases cover the error, ownership, expiry and null-address2 paths.

Verification: `bun run verify` exit 0 (643 tests), `bun run build` exit 0. The edited E2E tests were not executed locally (no Chromium); Validation/CI runs them.
