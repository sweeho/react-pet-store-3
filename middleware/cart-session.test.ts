import { randomUUID } from "node:crypto";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { CART_COOKIE_NAME } from "../lib/cart";
import cartSession from "./cart-session";

/**
 * INTEGRATION TEST (server project). design.md D1/C8, real H3Event.
 */
function makeEvent(pathname: string, method = "GET", cookie?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost${pathname}`, {
      method,
      headers: cookie ? { cookie } : undefined,
    }),
  );
}

function cartCookie(event: H3Event): string | undefined {
  return event.res.headers.getSetCookie().find((c) => c.startsWith(`${CART_COOKIE_NAME}=`));
}

describe("cart-session middleware", () => {
  it("[SWHR3-C-0056] a first GET sets no cookie and no token", async () => {
    const event = makeEvent("/api/cart");
    await cartSession(event);
    expect(event.context.cartSession).toBeUndefined();
    expect(cartCookie(event)).toBeUndefined();
  });

  it("[SWHR3-C-0056] the first write mints an httpOnly UUID cookie", async () => {
    const event = makeEvent("/api/cart", "POST");
    await cartSession(event);
    const cookie = cartCookie(event);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/Max-Age/i);
    const token = cookie!.split(";")[0].split("=")[1];
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.context.cartSession).toBe(token);
  });

  it("[SWHR3-C-0053] a later request carrying the cookie resolves the same token", async () => {
    const first = makeEvent("/api/cart", "POST");
    await cartSession(first);
    const token = first.context.cartSession!;
    const later = makeEvent("/api/cart", "GET", `${CART_COOKIE_NAME}=${token}`);
    await cartSession(later);
    expect(later.context.cartSession).toBe(token);
    expect(cartCookie(later)).toBeUndefined();
  });

  it("treats a non-UUID cookie as absent", async () => {
    const get = makeEvent("/api/cart", "GET", `${CART_COOKIE_NAME}=not-a-uuid`);
    await cartSession(get);
    expect(get.context.cartSession).toBeUndefined();

    const post = makeEvent("/api/cart", "PUT", `${CART_COOKIE_NAME}=not-a-uuid`);
    await cartSession(post);
    expect(post.context.cartSession).toMatch(/^[0-9a-f-]{36}$/);
    expect(post.context.cartSession).not.toBe("not-a-uuid");
  });

  it("ignores paths outside /api/cart", async () => {
    const event = makeEvent("/api/hello", "POST", `${CART_COOKIE_NAME}=${randomUUID()}`);
    await cartSession(event);
    expect(event.context.cartSession).toBeUndefined();
    expect(cartCookie(event)).toBeUndefined();
  });
});
