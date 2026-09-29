import { randomUUID } from "node:crypto";
import { H3Event } from "nitro/h3";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { cartItems, catalogItemDetails, catalogItems } from "../db/schema";
import { getItems } from "./cart";
import { resolveCartLocale } from "./cart-locale";

/**
 * UNIT TEST (server project). design.md D7/C7: the locale is resolved per
 * request from the session, defaulting to en_US (SD6).
 */
function makeEvent(): H3Event {
  return new H3Event(new Request("http://localhost/api/cart"));
}

beforeAll(() => {
  db.insert(catalogItems)
    .values({ itemId: "LOC-1", productId: "FI-SW-01", category: "FISH", unitCostCents: 1650 })
    .onConflictDoNothing()
    .run();
  db.insert(catalogItemDetails)
    .values([
      { itemId: "LOC-1", locale: "en_US", name: "Angelfish", attribute: "Large" },
      { itemId: "LOC-1", locale: "ja_JP", name: "エンゼルフィッシュ", attribute: "大" },
    ])
    .onConflictDoNothing()
    .run();
});

describe("resolveCartLocale", () => {
  it("[SWHR3-C-0078] defaults to en_US when the context carries no locale", () => {
    const token = randomUUID();
    db.insert(cartItems).values({ sessionToken: token, itemId: "LOC-1", quantity: 1 }).run();

    expect(getItems(token)[0].name).toBe("Angelfish");
    expect(resolveCartLocale(makeEvent())).toBe("en_US");
  });

  it("returns the locale carried in the request context", () => {
    const event = makeEvent();
    event.context.locale = "ja_JP";
    expect(resolveCartLocale(event)).toBe("ja_JP");
  });

  it("[SWHR3-C-0076] getItems with ja_JP returns the Japanese catalogue name", () => {
    const token = randomUUID();
    db.insert(cartItems).values({ sessionToken: token, itemId: "LOC-1", quantity: 1 }).run();

    expect(getItems(token, "ja_JP")[0].name).toBe("エンゼルフィッシュ");
  });
});
