/**
 * Client mirror of the cart response types (design.md C3, C9), matching
 * lib/cart-item.ts. Money is integer cents.
 */
export interface CartLine {
  itemId: string;
  productId: string;
  category: string;
  name: string;
  attribute: string;
  quantity: number;
  unitCostCents: number;
  totalCostCents: number;
}

export interface CartView {
  items: CartLine[];
  subtotalCents: number;
  count: number;
  locale: string;
}
