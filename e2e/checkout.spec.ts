import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives checkout (design.md D1-D13) end to end in a real browser against the
 * seeded catalogue. The runner cannot load bun:sqlite, so the catalogue is
 * seeded by spawning db/seed-catalog.ts under Bun, as e2e/cart.spec.ts does.
 * Each test registers its own customer, gives them a profile (which pre-fills
 * billing), and fills the cart through page.request, which shares the browser
 * context's cookies. Every test gets its own context, so its own cart.
 *
 * Seeded: EST-1 "Angelfish / Large" and EST-2 "Angelfish / Small", 1650 cents
 * each, so two items total $33.00.
 */
const PASSWORD = "correct-horse-1";
const CARD_NUMBER = "4111 1111 1111 4412";
const CARD_YEAR = new Date().getFullYear() + 2;

// The script runs db/client.ts's migrate() on import; several spawning at once
// against a cold database can hit SQLITE_BUSY, so retry briefly.
function seedCatalog(): void {
  let lastFailure = "";
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = spawnSync("bun", ["db/seed-catalog.ts"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    if (result.status === 0) {
      return;
    }
    lastFailure = result.stderr || result.stdout;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 150);
  }
  throw new Error(`bun db/seed-catalog.ts failed: ${lastFailure}`);
}

test.beforeAll(() => {
  seedCatalog();
});

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

// Registers a customer (which signs the context in) and creates their profile.
// Returns the profile's email, which billing is pre-filled with.
async function registerCustomer(page: Page): Promise<string> {
  const username = uniqueUsername("chk");
  const email = `${username}@example.com`;
  const register = await page.request.post("/api/auth/register", {
    data: { j_username: username, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
  expect(register.ok()).toBe(true);
  const profile = await page.request.post("/api/customers", {
    data: {
      firstName: "Grace",
      lastName: "Hopper",
      email,
      telephone: "555-0100",
      address: {
        street1: "1 Analytical Engine Way",
        street2: null,
        city: "London",
        state: "LDN",
        postalCode: "SW1A 1AA",
        country: "UK",
      },
      card: {
        cardType: "Visa",
        cardNumber: "4111111111111111",
        expiryMonth: 12,
        expiryYear: CARD_YEAR,
      },
      preferences: {
        locale: "en_US",
        favoriteCategory: "BIRDS",
        myListEnabled: false,
        petTipsEnabled: false,
      },
    },
  });
  expect(profile.ok()).toBe(true);
  return email;
}

async function fillCart(page: Page): Promise<void> {
  for (const itemId of ["EST-1", "EST-2"]) {
    const response = await page.request.post("/api/cart", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
}

async function fillShippingAndPayment(page: Page): Promise<void> {
  const shipping = page.getByRole("region", { name: "Shipping address" });
  await shipping.getByLabel(/^Given name/).fill("Ada");
  await shipping.getByLabel(/^Family name/).fill("Lovelace");
  await shipping.getByLabel(/^Address line 1/).fill("88 Market Street");
  await shipping.getByLabel(/^City/).fill("San Francisco");
  await shipping.getByLabel(/^State or province/).fill("CA");
  await shipping.getByLabel(/^Postal code/).fill("94103");
  await shipping.getByLabel(/^Country/).fill("United States");
  await shipping.getByLabel(/^Telephone/).fill("+1 415 555 0177");
  await shipping.getByLabel(/^Email/).fill("ada@example.com");

  await page.getByLabel("Card type").selectOption("Java Card");
  await page.getByLabel("Card number").fill(CARD_NUMBER);
  await page.getByLabel("Expiry month").selectOption("03");
  await page.getByLabel("Expiry year").selectOption(String(CARD_YEAR));
}

test("[SWHR3-C-0145] a signed-out visit to /checkout goes to sign-in", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page).toHaveURL(/\/signin\?redirect=(%2F|\/)checkout$/);
});

test("[SWHR3-C-0144] signed-in checkout from start to confirmation", async ({ page }) => {
  const email = await registerCustomer(page);
  await fillCart(page);

  await page.goto("/checkout");
  const billing = page.getByRole("region", { name: "Billing address" });
  await expect(billing.getByLabel(/^Given name/)).toHaveValue("Grace");
  await expect(billing.getByLabel(/^Email/)).toHaveValue(email);
  await expect(page.getByText("Pre-filled from your account")).toBeVisible();

  await fillShippingAndPayment(page);
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = page.url().split("/").pop() ?? "";
  await expect(
    page.getByRole("heading", { name: "Thank you — your order has been received" }),
  ).toBeVisible();
  await expect(page.getByText(orderId, { exact: true })).toBeVisible();
  await expect(page.getByText("Notifications sent to")).toBeVisible();
  await expect(page.getByText(email, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("group", { name: "Billed to" })).toContainText(
    "1 Analytical Engine Way",
  );
  await expect(page.getByRole("group", { name: "Shipped to" })).toContainText("88 Market Street");
  await expect(page.getByTestId("order-line")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "What you ordered" })).toContainText("$33.00");
  await expect(page.getByText(`Java Card ending 4412 · Expires 03/${CARD_YEAR}`)).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("Your Shopping Cart is Empty")).toBeVisible();
});

test("a blank billing city is listed in the summary and the order is not placed", async ({
  page,
}) => {
  await registerCustomer(page);
  await fillCart(page);
  await page.goto("/checkout");
  await fillShippingAndPayment(page);

  await page.getByRole("region", { name: "Billing address" }).getByLabel(/^City/).fill("");
  await page.getByRole("button", { name: "Place order" }).click();

  const summary = page.getByRole("alert");
  await expect(summary).toContainText("Your order was not placed — 1 required field is missing");
  await expect(summary).toContainText("Billing · City");
  await expect(page.getByText("Enter a city.")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("[SWHR3-C-0118] emptying the cart mid-checkout stops the order in the browser", async ({
  page,
}) => {
  await registerCustomer(page);
  await fillCart(page);
  await page.goto("/checkout");
  await fillShippingAndPayment(page);

  const response = await page.request.delete("/api/cart");
  expect(response.ok()).toBe(true);
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("heading", { name: "Your shopping cart is empty" })).toBeVisible();
  await expect(
    page.getByText("The Shopping Cart is Empty and the order could not be placed."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Billing address" })).toHaveCount(0);
});
