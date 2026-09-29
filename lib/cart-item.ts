export interface CatalogItem {
  itemId: string;
  productId: string;
  category: string;
  name: string;
  attribute: string;
  unitCostCents: number;
}

export interface CartItem {
  itemId: string;
  productId: string;
  category: string;
  name: string;
  attribute: string;
  quantity: number;
  unitCostCents: number;
}

export type CartLine = CartItem & { totalCostCents: number };

export interface CartView {
  items: CartLine[];
  subtotalCents: number;
  count: number;
  locale: string;
}

export function createCartItem(item: CatalogItem, quantity: number): CartItem {
  return {
    itemId: item.itemId,
    productId: item.productId,
    category: item.category,
    name: item.name,
    attribute: item.attribute,
    quantity,
    unitCostCents: item.unitCostCents,
  };
}

export function cartItemTotalCostCents(i: CartItem): number {
  return i.quantity * i.unitCostCents;
}

export function cartItemUnitCost(i: CartItem): number {
  return i.unitCostCents / 100;
}

export function cartItemTotalCost(i: CartItem): number {
  return cartItemTotalCostCents(i) / 100;
}
