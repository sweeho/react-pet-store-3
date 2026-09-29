---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0065
---

# Summary — SWHR3-T-0065

Added `resolveCartLocale(event)` in `lib/cart-locale.ts` (`event.context.locale ?? DEFAULT_CART_LOCALE`). `getItems` and `getSubTotalCents` in `lib/cart.ts` already default `locale` to `DEFAULT_CART_LOCALE`, so `lib/cart.ts` is unchanged.

Files: `lib/cart-locale.ts`, `lib/cart-locale.test.ts`.

Deviation (minor): the `getItems` locale tests live in `lib/cart-locale.test.ts` beside the resolver rather than in `lib/cart.test.ts`, to keep both C-0078 assertions in one test.

AC coverage: AC-1 by `[SWHR3-C-0078]`; `[SWHR3-C-0076]` covers a non-default locale.

Verification: `bun run verify` exit 0, 489 tests passed.
