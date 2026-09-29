import type { InventoryRow, InventoryUpdateResult } from "@/types/supplier";

export function getInventory(): Promise<InventoryRow[]> {
  throw new Error("VortexNotImplemented");
}

export function updateInventory(
  fields: Record<string, string | boolean>,
): Promise<InventoryUpdateResult> {
  void fields;
  throw new Error("VortexNotImplemented");
}
