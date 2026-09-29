import type { CatalogItem } from "./cart-item";
import type { DbOrTx } from "./transaction";

export type { CatalogItem };

export function getItem(itemId: string, locale: string, outer?: DbOrTx): CatalogItem {
  void itemId;
  void locale;
  void outer;
  throw new Error("VortexNotImplemented");
}
