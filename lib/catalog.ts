/**
 * Minimal catalogue reader (design.md D3, C4). Details are locale-specific
 * and fall back to en_US; an item with no row, or no details in the
 * requested locale or en_US, is not found.
 */
import { and, eq } from "drizzle-orm";

import { catalogItemDetails, catalogItems } from "../db/schema";
import type { CatalogItem } from "./cart-item";
import { DEFAULT_CART_LOCALE } from "./cart";
import { CatalogItemNotFoundError } from "./errors";
import { type DbOrTx, withTransaction } from "./transaction";

export type { CatalogItem };

export function getItem(itemId: string, locale: string, outer?: DbOrTx): CatalogItem {
  return withTransaction((tx) => {
    const item = tx.select().from(catalogItems).where(eq(catalogItems.itemId, itemId)).get();
    if (!item) {
      throw new CatalogItemNotFoundError(itemId);
    }

    const detailsFor = (detailLocale: string) =>
      tx
        .select()
        .from(catalogItemDetails)
        .where(
          and(eq(catalogItemDetails.itemId, itemId), eq(catalogItemDetails.locale, detailLocale)),
        )
        .get();
    const details = detailsFor(locale) ?? detailsFor(DEFAULT_CART_LOCALE);
    if (!details) {
      throw new CatalogItemNotFoundError(itemId);
    }

    return {
      itemId: item.itemId,
      productId: item.productId,
      category: item.category,
      name: details.name,
      attribute: details.attribute,
      unitCostCents: item.unitCostCents,
    };
  }, outer);
}
