/**
 * Inventory reservation (design.md D5, C6). Reservation is all or nothing:
 * every item's stock must cover its total quantity across the lines, or
 * nothing is written. Runs through the caller's transaction.
 */
import { eq, sql } from "drizzle-orm";

import { inventory, inventoryReservations } from "../db/schema";
import { type DbOrTx, withTransaction } from "./transaction";

export interface InventoryLine {
  itemId: string;
  quantity: number;
}

/**
 * Decrements stock and records one reservation per item when every item is
 * covered (a missing inventory row counts as 0); otherwise changes nothing
 * and returns false. Lines for the same item are summed.
 */
export function reserveInventory(tx: DbOrTx, orderId: number, lines: InventoryLine[]): boolean {
  const needed = new Map<string, number>();
  for (const line of lines) {
    needed.set(line.itemId, (needed.get(line.itemId) ?? 0) + line.quantity);
  }

  for (const [itemId, quantity] of needed) {
    const row = tx.select().from(inventory).where(eq(inventory.itemId, itemId)).get();
    if ((row?.quantity ?? 0) < quantity) {
      return false;
    }
  }

  for (const [itemId, quantity] of needed) {
    tx.update(inventory)
      .set({ quantity: sql`${inventory.quantity} - ${quantity}` })
      .where(eq(inventory.itemId, itemId))
      .run();
    tx.insert(inventoryReservations).values({ orderId, itemId, quantity }).run();
  }
  return true;
}

/** Sets an item's stock, inserting the row when it does not exist. */
export function setInventory(itemId: string, quantity: number, outer?: DbOrTx): void {
  withTransaction((tx) => {
    tx.insert(inventory)
      .values({ itemId, quantity })
      .onConflictDoUpdate({ target: inventory.itemId, set: { quantity } })
      .run();
  }, outer);
}
