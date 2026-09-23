import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, creditCards, customers } from "../db/schema";

/**
 * UNIT TEST (server project)
 *
 * Exercises the customers/creditCards tables directly against the real
 * in-memory db (VITEST=true swaps sqlite.db for :memory:, see
 * db/client.ts) — this ticket adds storage only, no lib/customer-storage.ts
 * service. Each test creates its own account so tests never collide.
 */
async function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

function fullCustomerInput(
  accountId: number,
  overrides: Partial<typeof customers.$inferInsert> = {},
) {
  return {
    accountId,
    firstName: "Ada",
    lastName: "Lovelace",
    email: `ada-${accountId}@example.com`,
    telephone: "555-0100",
    street1: "1 Analytical Engine Way",
    street2: "Suite 2",
    city: "London",
    state: "LDN",
    postalCode: "SW1A 1AA",
    country: "UK",
    locale: "en_US",
    favoriteCategory: "BIRDS",
    myListEnabled: true,
    petTipsEnabled: false,
    ...overrides,
  };
}

describe("customers/creditCards storage (AC-1, AC-2)", () => {
  it("persists every customer and card column and reads it back unchanged", async () => {
    const account = await makeAccount("storage-full-1");
    const customer = await db
      .insert(customers)
      .values(fullCustomerInput(account.id))
      .returning()
      .get();

    await db
      .insert(creditCards)
      .values({
        customerId: customer.id,
        cardType: "Visa",
        cardNumber: "4111111111111111",
        expiryMonth: 12,
        expiryYear: 2030,
      })
      .run();

    const storedCustomer = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    const storedCard = db
      .select()
      .from(creditCards)
      .where(eq(creditCards.customerId, customer.id))
      .get();

    expect(storedCustomer).toMatchObject({
      accountId: account.id,
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${account.id}@example.com`,
      telephone: "555-0100",
      street1: "1 Analytical Engine Way",
      street2: "Suite 2",
      city: "London",
      state: "LDN",
      postalCode: "SW1A 1AA",
      country: "UK",
      locale: "en_US",
      favoriteCategory: "BIRDS",
      myListEnabled: true,
      petTipsEnabled: false,
    });
    expect(storedCustomer?.createdAt).toBeInstanceOf(Date);
    expect(storedCustomer?.updatedAt).toBeInstanceOf(Date);
    expect(storedCard).toMatchObject({
      customerId: customer.id,
      cardType: "Visa",
      cardNumber: "4111111111111111",
      expiryMonth: 12,
      expiryYear: 2030,
    });
  });

  it("defaults locale to en_US and allows a null street2/favoriteCategory", async () => {
    const account = await makeAccount("storage-defaults-1");

    const customer = await db
      .insert(customers)
      .values({
        accountId: account.id,
        firstName: "Grace",
        lastName: "Hopper",
        email: `grace-${account.id}@example.com`,
        telephone: "555-0101",
        street1: "1 Compiler Lane",
        street2: null,
        city: "Arlington",
        state: "VA",
        postalCode: "22201",
        country: "US",
        favoriteCategory: null,
        myListEnabled: false,
        petTipsEnabled: true,
      })
      .returning()
      .get();

    expect(customer.locale).toBe("en_US");
    expect(customer.street2).toBeNull();
    expect(customer.favoriteCategory).toBeNull();
  });

  it("deletes the card row when its customer row is deleted (AC-3)", async () => {
    const account = await makeAccount("storage-cascade-1");
    const customer = await db
      .insert(customers)
      .values(fullCustomerInput(account.id))
      .returning()
      .get();
    await db
      .insert(creditCards)
      .values({
        customerId: customer.id,
        cardType: "MasterCard",
        cardNumber: "5500000000000004",
        expiryMonth: 1,
        expiryYear: 2031,
      })
      .run();

    db.delete(customers).where(eq(customers.id, customer.id)).run();

    const remainingCard = db
      .select()
      .from(creditCards)
      .where(eq(creditCards.customerId, customer.id))
      .get();
    expect(remainingCard).toBeUndefined();
  });

  it("rejects a second customer row for the same account (AC-3)", async () => {
    const account = await makeAccount("storage-dup-account-1");
    await db.insert(customers).values(fullCustomerInput(account.id)).returning().get();

    expect(() =>
      db
        .insert(customers)
        .values(fullCustomerInput(account.id, { email: `second-${account.id}@example.com` }))
        .run(),
    ).toThrow();
  });

  it("rejects a duplicate email across different accounts", async () => {
    const accountA = await makeAccount("storage-dup-email-a-1");
    const accountB = await makeAccount("storage-dup-email-b-1");
    const sharedEmail = "shared@example.com";
    await db
      .insert(customers)
      .values(fullCustomerInput(accountA.id, { email: sharedEmail }))
      .run();

    expect(() =>
      db
        .insert(customers)
        .values(fullCustomerInput(accountB.id, { email: sharedEmail }))
        .run(),
    ).toThrow();
  });
});
