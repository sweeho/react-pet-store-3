/**
 * A supplier PO's delivery address (design.md D4, C3 of supplier-portal-and-
 * inventory), stored 1:1 with the PO's contact: the foreign key means an
 * address cannot exist without one. Kept for shipping, never displayed (SD5).
 */
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { supplierPoAddresses } from "../db/schema";
import { NotFoundError } from "./errors";
import type { DbOrTx } from "./transaction";

export interface SupplierAddress {
  address1: string;
  address2: string | null;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

/** Writes the PO's address; the contact must already exist (foreign key). */
export function insertSupplierAddress(tx: DbOrTx, poId: number, address: SupplierAddress): void {
  tx.insert(supplierPoAddresses)
    .values({
      supplierPoId: poId,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      stateOrProvince: address.stateOrProvince,
      postalCode: address.postalCode,
      country: address.country,
    })
    .run();
}

export function getSupplierAddress(poId: number, tx?: DbOrTx): SupplierAddress {
  const row = (tx ?? db)
    .select()
    .from(supplierPoAddresses)
    .where(eq(supplierPoAddresses.supplierPoId, poId))
    .get();
  if (!row) {
    throw new NotFoundError(`Supplier PO ${poId} has no address`);
  }
  return {
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    stateOrProvince: row.stateOrProvince,
    postalCode: row.postalCode,
    country: row.country,
  };
}
