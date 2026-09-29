import type { DbOrTx } from "./transaction";

export function applyInventoryUpdate(
  updates: { itemId: string; quantity: number }[],
  outer?: DbOrTx,
): { updated: string[]; processedOrders: number; fulfilledOrders: number } {
  void updates;
  void outer;
  throw new Error("VortexNotImplemented");
}
