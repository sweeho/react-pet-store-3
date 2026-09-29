/**
 * A supplier PO's delivery contact (design.md D4, C3 of supplier-portal-and-
 * inventory), stored 1:1 with the PO. It is kept for shipping and never
 * displayed in the portal (SD5).
 */
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { supplierPoContacts } from "../db/schema";
import { NotFoundError } from "./errors";
import type { DbOrTx } from "./transaction";

export interface SupplierContact {
  givenName: string;
  familyName: string;
  email: string;
  telephone: string;
}

/** Writes the PO's contact; a second insert for the same PO fails on the primary key. */
export function insertSupplierContact(tx: DbOrTx, poId: number, contact: SupplierContact): void {
  tx.insert(supplierPoContacts)
    .values({
      supplierPoId: poId,
      givenName: contact.givenName,
      familyName: contact.familyName,
      email: contact.email,
      telephone: contact.telephone,
    })
    .run();
}

export function getSupplierContact(poId: number, tx?: DbOrTx): SupplierContact {
  const row = (tx ?? db)
    .select()
    .from(supplierPoContacts)
    .where(eq(supplierPoContacts.supplierPoId, poId))
    .get();
  if (!row) {
    throw new NotFoundError(`Supplier PO ${poId} has no contact`);
  }
  return {
    givenName: row.givenName,
    familyName: row.familyName,
    email: row.email,
    telephone: row.telephone,
  };
}
