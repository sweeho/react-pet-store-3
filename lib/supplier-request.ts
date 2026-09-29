export const QTY_FIELD_PREFIX = "qty_";
export const ITEM_FIELD_PREFIX = "item_";

export function parseInventoryForm(body: unknown): { itemId: string; quantity: number }[] {
  void body;
  throw new Error("VortexNotImplemented");
}
