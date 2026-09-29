/**
 * Inventory reservation (design.md D5, C6). Reservation is all or nothing:
 * every item's stock must cover its total quantity across the lines, or
 * nothing is written. Runs through the caller's transaction.
 */
import { eq, sql } from "drizzle-orm";

import { catalogItems, inventory, inventoryReservations } from "../db/schema";
import { NotFoundError } from "./errors";
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

export interface InventoryRow {
  itemId: string;
  quantity: number;
}

/** Every catalogue item with its stock in item-id order; an item with no inventory row reads 0 (D8). */
export function getInventory(outer?: DbOrTx): InventoryRow[] {
  return withTransaction((tx) => {
    return tx
      .select({
        itemId: catalogItems.itemId,
        quantity: sql<number>`coalesce(${inventory.quantity}, 0)`,
      })
      .from(catalogItems)
      .leftJoin(inventory, eq(inventory.itemId, catalogItems.itemId))
      .orderBy(catalogItems.itemId)
      .all();
  }, outer);
}

/** One catalogue item's stock; a non-catalogue item throws NotFoundError. */
export function getInventoryItem(itemId: string, outer?: DbOrTx): InventoryRow {
  return withTransaction((tx) => {
    const row = tx
      .select({
        itemId: catalogItems.itemId,
        quantity: sql<number>`coalesce(${inventory.quantity}, 0)`,
      })
      .from(catalogItems)
      .leftJoin(inventory, eq(inventory.itemId, catalogItems.itemId))
      .where(eq(catalogItems.itemId, itemId))
      .get();
    if (!row) {
      throw new NotFoundError(`Inventory item ${itemId} not found`);
    }
    return row;
  }, outer);
}

/** Sets an item's stock and reports the quantity before (0 when it had no row) and after. */
export function updateQuantity(
  tx: DbOrTx,
  itemId: string,
  quantity: number,
): { before: number; after: number } {
  const before =
    tx
      .select({ quantity: inventory.quantity })
      .from(inventory)
      .where(eq(inventory.itemId, itemId))
      .get()?.quantity ?? 0;
  setInventory(itemId, quantity, tx);
  return { before, after: quantity };
}
