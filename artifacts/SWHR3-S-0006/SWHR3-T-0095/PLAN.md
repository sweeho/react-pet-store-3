---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0095
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0095/tdd-test-result.md]
---

# Plan — SWHR3-T-0095: Struts Configuration — POST /api/orders, protection lists, cart cookie on /api/orders and client binding

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 13. Requirement(s): "Order processing workflow". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0088.

## Objective

`POST /api/orders` exists and is protected. The cart cookie reaches it, and the client has one typed binding for the orders API.

## Steps

1. Create `routes/api/orders/index.post.ts` (+ test). It reads the body, calls `parseCheckoutRequest` and then `placeOrder` with `accountId` from `event.context.user`, `cartToken` from `event.context.cartSession` and the locale from `resolveCartLocale`. It answers 201 per C9 and converts errors with `toHttpError`.
2. Add `/api/orders` to `PROTECTED_API_PATHS` in `lib/protected-resources.ts` and `/checkout` to `PROTECTED_PAGE_PATHS` in `src/constants/protected-pages.ts` (D7), extending both tests. Extend `middleware/cart-session.ts` to resolve the cart cookie for `/api/orders*` without ever minting one there (D8), and extend its test.
3. Create `src/types/checkout.ts` (the C10 mirror plus a parity test against `lib/`), `src/constants/checkout.ts` (`ORDER_CONFIRMATION_PATH`) and `src/utils/orders-api.ts` (+ test). Point `src/components/checkout/payment-fields.tsx` at the mirror, changing the import only.
4. `/checkout` is now protected, so update the two `/checkout` tests in `e2e/cart.spec.ts` (`[SWHR3-C-0090]`, `[SWHR3-C-0092]`) to sign in first, as `e2e/customer-auth.spec.ts` does. Keep their assertions.
5. The route test (real `H3Event` through both middlewares) covers: a signed-in call with a full body and a populated cart answers 201, and the order's billing and shipping equal the `_a` and `_b` fields and its card the payment fields. It also covers 422 with `missingFields`, 409 for an empty cart, and 401 signed out.

## File/module ownership

- `routes/api/orders/index.post.ts, routes/api/orders/index.post.test.ts`
- `lib/protected-resources.ts, lib/protected-resources.test.ts`
- `middleware/cart-session.ts, middleware/cart-session.test.ts`
- `src/constants/protected-pages.ts`
- `src/types/checkout.ts` (+ parity test), src/constants/checkout.ts
- `src/utils/orders-api.ts, src/utils/orders-api.test.ts`
- `src/components/checkout/payment-fields.tsx` (import line only)
- `e2e/cart.spec.ts` (sign-in step for the two /checkout tests only)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 13 checkboxes tagged with this key are stamped when it merges.
