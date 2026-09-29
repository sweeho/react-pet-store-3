/**
 * Client-safe mirror of the supplier inventory types (design.md C5, C11,
 * D7 of supplier-portal-and-inventory). The client cannot import from lib/;
 * lib/supplier-mirror.test.ts pins parity with lib/inventory.ts.
 */
export interface InventoryRow {
  itemId: string;
  quantity: number;
}

/** The body of a successful `POST /api/supplier/inventory` (D7). */
export interface InventoryUpdateResult {
  updated: string[];
  processedOrders: number;
  fulfilledOrders: number;
  inventory: InventoryRow[];
}
