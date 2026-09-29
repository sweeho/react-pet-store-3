import type { H3Event } from "nitro/h3";

import { DEFAULT_CART_LOCALE } from "./cart";

/**
 * The caller's locale for catalogue lookups (design.md D7, C7): the session
 * locale set by middleware/auth.ts, else en_US. Nothing is stored on the cart.
 */
export function resolveCartLocale(event: H3Event): string {
  return event.context.locale ?? DEFAULT_CART_LOCALE;
}
