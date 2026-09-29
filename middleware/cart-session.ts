/**
 * Resolves the anonymous cart token into event.context.cartSession for
 * /api/cart* paths (design.md D1, C8). The token lives in its own httpOnly
 * cookie, separate from the sign-in session. A first GET/HEAD leaves it
 * unset and sets no cookie; a write with no valid cookie mints a UUID. A
 * cookie value that is not a UUID reads as absent.
 */
import { randomUUID } from "node:crypto";
import { defineHandler, getCookie, getRequestURL, setCookie } from "nitro/h3";

import { CART_COOKIE_NAME } from "../lib/cart";

declare module "h3" {
  interface H3EventContext {
    cartSession?: string;
  }
}

const CART_PATH_PREFIX = "/api/cart";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineHandler((event) => {
  if (!getRequestURL(event).pathname.startsWith(CART_PATH_PREFIX)) {
    return;
  }

  const cookie = getCookie(event, CART_COOKIE_NAME);
  if (cookie && UUID_PATTERN.test(cookie)) {
    event.context.cartSession = cookie;
    return;
  }

  if (event.req.method === "GET" || event.req.method === "HEAD") {
    return;
  }

  const token = randomUUID();
  setCookie(event, CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  event.context.cartSession = token;
});
