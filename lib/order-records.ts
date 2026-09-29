import type { DbOrTx } from "./transaction";

export interface OrderRecord {
  order: unknown;
}

export function getOrderRecord(orderId: number, tx?: DbOrTx): OrderRecord {
  void orderId;
  void tx;
  throw new Error("VortexNotImplemented");
}

export function listOrdersByStage(stage: string, tx?: DbOrTx): unknown[] {
  void stage;
  void tx;
  throw new Error("VortexNotImplemented");
}
