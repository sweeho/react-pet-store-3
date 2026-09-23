import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { accounts, creditCards, customers } from "../db/schema";
import { createCustomer, deleteCustomer, getCustomerProfile, updateCustomer } from "./customers";
import { DuplicateEmailError, NotFoundError, ProfileExistsError, ValidationError } from "./errors";

/**
 * UNIT TEST (server project)
 *
 * Exercises lib/customers.ts (C15) against the real in-memory db
 * (VITEST=true swaps sqlite.db for :memory:, see db/client.ts) — same
 * pattern as lib/accounts.test.ts. Each test creates its own account and
 * picks its own email so tests never collide.
 */
async function makeAccount(username: string) {
  return db
    .insert(accounts)
    .values({ username, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
}

function completeInput(email: string, overrides: Record<string, unknown> = {}) {
  const currentYear = new Date().getFullYear();
  return {
    firstName: "Alice",
    lastName: "Anderson",
    email,
    telephone: "555-0100",
    address: {
      street1: "1 Main St",
      street2: "Apt 4",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "USA",
    },
    card: {
      cardType: "Visa",
      cardNumber: "4111111111111111",
      expiryMonth: 12,
      expiryYear: currentYear + 1,
    },
    preferences: {
      locale: "en_US",
      favoriteCategory: "CATS",
      myListEnabled: true,
      petTipsEnabled: false,
    },
    ...overrides,
  };
}

describe("createCustomer", () => {
  it("creates the customer and its card, masking the card number in the response (AC-1)", async () => {
    const account = await makeAccount("cust-create-1");

    const profile = await createCustomer(account.id, completeInput("create1@example.com"));

    expect(profile).toEqual({
      username: "cust-create-1",
      firstName: "Alice",
      lastName: "Anderson",
      email: "create1@example.com",
      telephone: "555-0100",
      address: {
        street1: "1 Main St",
        street2: "Apt 4",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "USA",
      },
      card: {
        cardType: "Visa",
        cardNumberLast4: "1111",
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 1,
      },
      preferences: {
        locale: "en_US",
        favoriteCategory: "CATS",
        myListEnabled: true,
        petTipsEnabled: false,
      },
    });
  });

  it("throws ProfileExistsError on a second create for the same account", async () => {
    const account = await makeAccount("cust-create-2");
    await createCustomer(account.id, completeInput("create2@example.com"));

    await expect(
      createCustomer(account.id, completeInput("create2-again@example.com")),
    ).rejects.toBeInstanceOf(ProfileExistsError);
  });

  it("throws DuplicateEmailError when another customer already uses the email, and creates nothing (AC-2)", async () => {
    const accountA = await makeAccount("cust-create-3a");
    const accountB = await makeAccount("cust-create-3b");
    await createCustomer(accountA.id, completeInput("shared-create@example.com"));

    await expect(
      createCustomer(accountB.id, completeInput("shared-create@example.com")),
    ).rejects.toBeInstanceOf(DuplicateEmailError);

    expect(await getCustomerProfile(accountB.id)).toBeNull();
  });

  it("throws ValidationError for an incomplete body and creates nothing", async () => {
    const account = await makeAccount("cust-create-4");

    await expect(createCustomer(account.id, {})).rejects.toBeInstanceOf(ValidationError);
    expect(await getCustomerProfile(account.id)).toBeNull();
  });

  it("rolls back the customer row when the card insert fails, leaving no profile behind", async () => {
    const account = await makeAccount("cust-create-5");
    // parseCustomerProfileInput fully validates card fields before any insert
    // is attempted, so a genuine card-insert failure can't be reached through
    // createCustomer's own inputs. tx.insert and db.insert both resolve to
    // the same BaseSQLiteDatabase.prototype.insert (SQLiteTransaction extends
    // BaseSQLiteDatabase), so patching it there forces the failure inside the
    // transaction regardless of which one calls it.
    const dbProto = Object.getPrototypeOf(Object.getPrototypeOf(db)) as {
      insert: typeof db.insert;
    };
    const originalInsert = dbProto.insert;
    const spy = vi.spyOn(dbProto, "insert").mockImplementation(function (
      this: typeof db,
      table: unknown,
    ) {
      if (table === creditCards) {
        throw new Error("forced card insert failure");
      }
      return originalInsert.call(this, table as Parameters<typeof db.insert>[0]);
    });

    try {
      await expect(
        createCustomer(account.id, completeInput("rollback@example.com")),
      ).rejects.toThrow("forced card insert failure");
    } finally {
      spy.mockRestore();
    }

    expect(await getCustomerProfile(account.id)).toBeNull();
    expect(
      db.select().from(customers).where(eq(customers.accountId, account.id)).get(),
    ).toBeUndefined();
  });
});

describe("getCustomerProfile", () => {
  it("returns null when the account has no profile", async () => {
    const account = await makeAccount("cust-get-1");

    expect(await getCustomerProfile(account.id)).toBeNull();
  });

  it("returns the persisted profile with every stored field (AC-1)", async () => {
    const account = await makeAccount("cust-get-2");
    await createCustomer(account.id, completeInput("get2@example.com"));

    const profile = await getCustomerProfile(account.id);

    expect(profile?.username).toBe("cust-get-2");
    expect(profile?.email).toBe("get2@example.com");
    expect(profile?.card.cardNumberLast4).toBe("1111");
  });
});

describe("updateCustomer", () => {
  it("persists every modification (AC-2)", async () => {
    const account = await makeAccount("cust-update-1");
    await createCustomer(account.id, completeInput("update1@example.com"));

    const updated = await updateCustomer(
      account.id,
      completeInput("update1-new@example.com", { firstName: "Alicia" }),
    );

    expect(updated.firstName).toBe("Alicia");
    expect(updated.email).toBe("update1-new@example.com");
    const reread = await getCustomerProfile(account.id);
    expect(reread?.firstName).toBe("Alicia");
    expect(reread?.email).toBe("update1-new@example.com");
  });

  it("keeps the existing card when the card number is left blank", async () => {
    const account = await makeAccount("cust-update-2");
    await createCustomer(account.id, completeInput("update2@example.com"));

    const updated = await updateCustomer(
      account.id,
      completeInput("update2@example.com", {
        card: {
          cardType: "Visa",
          cardNumber: "",
          expiryMonth: 12,
          expiryYear: new Date().getFullYear() + 1,
        },
      }),
    );

    expect(updated.card.cardNumberLast4).toBe("1111");
  });

  it("replaces the card when a new number is given", async () => {
    const account = await makeAccount("cust-update-3");
    await createCustomer(account.id, completeInput("update3@example.com"));

    const updated = await updateCustomer(
      account.id,
      completeInput("update3@example.com", {
        card: {
          cardType: "MasterCard",
          cardNumber: "5500000000000004",
          expiryMonth: 6,
          expiryYear: new Date().getFullYear() + 2,
        },
      }),
    );

    expect(updated.card.cardNumberLast4).toBe("0004");
    expect(updated.card.cardType).toBe("MasterCard");
  });

  it("throws NotFoundError when the account has no profile", async () => {
    const account = await makeAccount("cust-update-4");

    await expect(
      updateCustomer(account.id, completeInput("update4@example.com")),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws DuplicateEmailError when another customer already uses the new email, and changes nothing (AC-2)", async () => {
    const accountA = await makeAccount("cust-update-5a");
    const accountB = await makeAccount("cust-update-5b");
    await createCustomer(accountA.id, completeInput("taken@example.com"));
    await createCustomer(accountB.id, completeInput("update5b@example.com"));

    await expect(
      updateCustomer(accountB.id, completeInput("taken@example.com")),
    ).rejects.toBeInstanceOf(DuplicateEmailError);

    const reread = await getCustomerProfile(accountB.id);
    expect(reread?.email).toBe("update5b@example.com");
  });

  it("allows keeping your own email unchanged", async () => {
    const account = await makeAccount("cust-update-6");
    await createCustomer(account.id, completeInput("update6@example.com"));

    const updated = await updateCustomer(
      account.id,
      completeInput("update6@example.com", { lastName: "Changed" }),
    );

    expect(updated.email).toBe("update6@example.com");
    expect(updated.lastName).toBe("Changed");
  });
});

describe("deleteCustomer", () => {
  it("removes the customer profile and its card", async () => {
    const account = await makeAccount("cust-delete-1");
    await createCustomer(account.id, completeInput("delete1@example.com"));
    const customerRow = db
      .select()
      .from(customers)
      .where(eq(customers.accountId, account.id))
      .get();

    await deleteCustomer(account.id);

    expect(await getCustomerProfile(account.id)).toBeNull();
    expect(
      db.select().from(creditCards).where(eq(creditCards.customerId, customerRow!.id)).get(),
    ).toBeUndefined();
  });
});
