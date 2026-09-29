/**
 * The supplier inventory update (design.md D6, C7, supplier-portal-and-
 * inventory): sets each quantity, logging it before and after, then retries
 * every PENDING supplier PO, all in one immediate transaction. Any failure
 * rolls back both the quantities and the reprocessing.
 */
import { updateQuantity } from "./inventory";
import { processPendingSupplierOrders } from "./supplier-fulfilment";
import { type DbOrTx, withTransaction } from "./transaction";

export function applyInventoryUpdate(
  updates: { itemId: string; quantity: number }[],
  outer?: DbOrTx,
): { updated: string[]; processedOrders: number; fulfilledOrders: number } {
  return withTransaction(
    (tx) => {
      const updated: string[] = [];
      for (const { itemId, quantity } of updates) {
        const { before, after } = updateQuantity(tx, itemId, quantity);
        console.info(`inventory-update: ${itemId} quantity ${before} -> ${after}`);
        updated.push(itemId);
      }
      const { processed, fulfilled } = processPendingSupplierOrders(tx);
      return { updated, processedOrders: processed, fulfilledOrders: fulfilled };
    },
    outer,
    { behavior: "immediate" },
  );
}
