import type { DbOrTx } from "./transaction";

export interface ShortItem {
  itemId: string;
  needed: number;
  available: number;
}

export interface FulfilmentOutcome {
  result: "FULFILLED" | "UNABLE" | "SKIPPED";
  shortItems: ShortItem[];
}

export function fulfilSupplierOrder(tx: DbOrTx, poId: number): FulfilmentOutcome {
  void tx;
  void poId;
  throw new Error("VortexNotImplemented");
}

export function processPendingSupplierOrders(tx: DbOrTx): { processed: number; fulfilled: number } {
  void tx;
  throw new Error("VortexNotImplemented");
}
