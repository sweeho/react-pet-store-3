import type { SupplierAddress } from "./supplier-order-addresses";
import type { SupplierContact } from "./supplier-order-contacts";
import type { SupplierOrderStatus } from "./supplier-order-status";
import type { DbOrTx } from "./transaction";

export interface SupplierOrderLine {
  itemId: string;
  quantity: number;
  quantityShipped: number;
  lineNumber: number;
  categoryId: string;
  productId: string;
  unitPriceCents: number;
}

export interface SupplierOrder {
  poId: number;
  poDate: Date;
  poStatus: SupplierOrderStatus;
  orderId: number;
  supplierId: string;
  expectedDeliveryDate: Date;
  trackingNumber: string | null;
  contact: SupplierContact | null;
  address: SupplierAddress | null;
  lines: SupplierOrderLine[];
}

export function getSupplierOrder(poId: number, tx?: DbOrTx): SupplierOrder {
  void poId;
  void tx;
  throw new Error("VortexNotImplemented");
}

export function listSupplierOrders(status?: SupplierOrderStatus, tx?: DbOrTx): SupplierOrder[] {
  void status;
  void tx;
  throw new Error("VortexNotImplemented");
}

export function deleteSupplierOrder(tx: DbOrTx, poId: number): void {
  void tx;
  void poId;
  throw new Error("VortexNotImplemented");
}
