/**
 * Customer profile persistence (design.md D8/D9/D12, interface contract
 * C15). createCustomer and updateCustomer each run their customer + card
 * writes in one withTransaction (C7), so a failure on either row leaves
 * neither behind.
 */
import { and, eq, ne } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { parseCustomerProfileInput, toCustomerProfile } from "./customer-profile";
import type { CustomerProfile } from "./customer-profile";
import { DuplicateEmailError, NotFoundError, ProfileExistsError } from "./errors";
import { withTransaction } from "./transaction";
import type { DbOrTx } from "./transaction";
import { accounts, creditCards, customers } from "../db/schema";
import { db } from "../db/client";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

type CustomerRow = InferSelectModel<typeof customers>;
type CreditCardRow = InferSelectModel<typeof creditCards>;

function findCustomerByAccountId(tx: DbOrTx, accountId: number): CustomerRow | undefined {
  return tx.select().from(customers).where(eq(customers.accountId, accountId)).get();
}

export async function createCustomer(accountId: number, input: unknown): Promise<CustomerProfile> {
  if (findCustomerByAccountId(db, accountId)) {
    throw new ProfileExistsError();
  }

  const parsed = parseCustomerProfileInput(input, "create");

  const { customer, card } = withTransaction((tx) => {
    let customerRow: CustomerRow;
    try {
      customerRow = tx
        .insert(customers)
        .values({
          accountId,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          telephone: parsed.telephone,
          street1: parsed.address.street1,
          street2: parsed.address.street2,
          city: parsed.address.city,
          state: parsed.address.state,
          postalCode: parsed.address.postalCode,
          country: parsed.address.country,
          locale: parsed.preferences.locale,
          favoriteCategory: parsed.preferences.favoriteCategory,
          myListEnabled: parsed.preferences.myListEnabled,
          petTipsEnabled: parsed.preferences.petTipsEnabled,
        })
        .returning()
        .get();
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }

    const cardRow = tx
      .insert(creditCards)
      .values({
        customerId: customerRow.id,
        cardType: parsed.card.cardType,
        cardNumber: parsed.card.cardNumber,
        expiryMonth: parsed.card.expiryMonth,
        expiryYear: parsed.card.expiryYear,
      })
      .returning()
      .get();

    return { customer: customerRow, card: cardRow };
  });

  // accountId always comes from an authenticated session (requireSessionUser
  // resolves it from a real session), so the account row always exists.
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get()!;

  return toCustomerProfile(account, customer, card);
}

export async function getCustomerProfile(accountId: number): Promise<CustomerProfile | null> {
  const row = db
    .select({ account: accounts, customer: customers, card: creditCards })
    .from(customers)
    .innerJoin(accounts, eq(customers.accountId, accounts.id))
    .innerJoin(creditCards, eq(creditCards.customerId, customers.id))
    .where(eq(customers.accountId, accountId))
    .get();

  if (!row) {
    return null;
  }

  return toCustomerProfile(row.account, row.customer, row.card);
}

export async function updateCustomer(accountId: number, input: unknown): Promise<CustomerProfile> {
  const existing = findCustomerByAccountId(db, accountId);
  if (!existing) {
    throw new NotFoundError("Customer profile not found");
  }

  const parsed = parseCustomerProfileInput(input, "update");

  const emailTaken = db
    .select()
    .from(customers)
    .where(and(eq(customers.email, parsed.email), ne(customers.id, existing.id)))
    .get();
  if (emailTaken) {
    throw new DuplicateEmailError();
  }

  const { customer, card } = withTransaction((tx) => {
    const updatedCustomer = tx
      .update(customers)
      .set({
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        telephone: parsed.telephone,
        street1: parsed.address.street1,
        street2: parsed.address.street2,
        city: parsed.address.city,
        state: parsed.address.state,
        postalCode: parsed.address.postalCode,
        country: parsed.address.country,
        locale: parsed.preferences.locale,
        favoriteCategory: parsed.preferences.favoriteCategory,
        myListEnabled: parsed.preferences.myListEnabled,
        petTipsEnabled: parsed.preferences.petTipsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, existing.id))
      .returning()
      .get();

    // D9: an empty card number keeps the whole card on file — the client
    // never resubmits a real number it can't see, so the other card fields
    // are ignored too rather than trusted on their own.
    let cardRow: CreditCardRow;
    if (parsed.card.cardNumber) {
      cardRow = tx
        .update(creditCards)
        .set({
          cardType: parsed.card.cardType,
          cardNumber: parsed.card.cardNumber,
          expiryMonth: parsed.card.expiryMonth,
          expiryYear: parsed.card.expiryYear,
        })
        .where(eq(creditCards.customerId, existing.id))
        .returning()
        .get();
    } else {
      // existing.id already has a card row (created alongside it in
      // createCustomer, and never deleted independently), so this is safe.
      cardRow = tx.select().from(creditCards).where(eq(creditCards.customerId, existing.id)).get()!;
    }

    return { customer: updatedCustomer, card: cardRow };
  });

  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get()!;

  return toCustomerProfile(account, customer, card);
}

export async function deleteCustomer(accountId: number): Promise<void> {
  db.delete(customers).where(eq(customers.accountId, accountId)).run();
}
