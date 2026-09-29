/**
 * Operator/E2E script (design.md D3): idempotently upserts sample catalogue
 * items with en_US and ja_JP details and prints their ids as JSON on the
 * last line of stdout, e.g. {"itemIds":["EST-1","EST-2"]}.
 *
 * Usage: bun db/seed-catalog.ts
 */
import { sql } from "drizzle-orm";

import { db } from "./client";
import { catalogItemDetails, catalogItems } from "./schema";

const ITEMS = [
  {
    itemId: "EST-1",
    productId: "FI-SW-01",
    category: "FISH",
    unitCostCents: 1650,
    en: ["Angelfish", "Large"],
    ja: ["エンゼルフィッシュ", "大"],
  },
  {
    itemId: "EST-2",
    productId: "FI-SW-01",
    category: "FISH",
    unitCostCents: 1650,
    en: ["Angelfish", "Small"],
    ja: ["エンゼルフィッシュ", "小"],
  },
  {
    itemId: "EST-3",
    productId: "K9-BD-01",
    category: "DOGS",
    unitCostCents: 1850,
    en: ["Bulldog", "Spotted Adult Male"],
    ja: ["ブルドッグ", "斑点のある成犬のオス"],
  },
  {
    itemId: "EST-4",
    productId: "FL-DSH-01",
    category: "CATS",
    unitCostCents: 1999,
    en: ["Manx", "Tailless"],
    ja: ["マンクス", "尾なし"],
  },
] as const;

// Concurrent seeders (parallel E2E workers) share one sqlite file; wait for
// the write lock instead of failing with SQLITE_BUSY.
db.run(sql`PRAGMA busy_timeout = 10000`);

db.transaction((tx) => {
  for (const item of ITEMS) {
    const { itemId, productId, category, unitCostCents } = item;
    tx.insert(catalogItems)
      .values({ itemId, productId, category, unitCostCents })
      .onConflictDoUpdate({
        target: catalogItems.itemId,
        set: { productId, category, unitCostCents },
      })
      .run();
    for (const [locale, [name, attribute]] of [
      ["en_US", item.en],
      ["ja_JP", item.ja],
    ] as const) {
      tx.insert(catalogItemDetails)
        .values({ itemId, locale, name, attribute })
        .onConflictDoUpdate({
          target: [catalogItemDetails.itemId, catalogItemDetails.locale],
          set: { name, attribute },
        })
        .run();
    }
  }
});

console.log(JSON.stringify({ itemIds: ITEMS.map((item) => item.itemId) }));
