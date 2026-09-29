/**
 * Supplier lookup for purchase orders (design.md D6, C7). The PRD names one
 * supplier, so every item maps to it; grouping in lib/supplier-pos.ts is
 * still generic.
 */
export const DEFAULT_SUPPLIER_ID = "PETSTORE-SUPPLIER";
export const SUPPLIER_LEAD_DAYS = 7;

export function supplierForItem(itemId: string): string {
  void itemId;
  return DEFAULT_SUPPLIER_ID;
}
