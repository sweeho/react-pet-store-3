import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the order workflow (order-processing-and-fulfilment design.md D1-D8)
 * in a real browser: place an order, approve it as an administrator, ship its
 * supplier PO, and see it Completed; plus the declined-card path. The runner
 * cannot load bun:sqlite, so the catalogue and inventory are seeded and the
 * shipment recorded by spawning the operator scripts under Bun, as
 * e2e/checkout.spec.ts and e2e/order-approval.spec.ts do. Every test
 * registers its own accounts and addresses its order only by the id it placed.
 */
const PASSWORD = "correct-horse-1";
const GOOD_CARD = "4111 1111 1111 4412";
const DECLINE_CARD = "4000 0000 0000 0002";
const CARD_YEAR = new Date().getFullYear() + 2;

// The scripts run db/client.ts's migrate() on import; several spawning at once
// against a cold database can hit SQLITE_BUSY, so retry briefly.
function runBun(args: string[]): string {
  let lastFailure = "";
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = spawnSync("bun", args, { cwd: process.cwd(), encoding: "utf8" });
    if (result.status === 0) {
      return result.stdout;
    }
    lastFailure = result.stderr || result.stdout;
    if (/^No account found with user name|^Usage:/m.test(lastFailure)) {
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 150);
  }
  throw new Error(`bun ${args.join(" ")} failed: ${lastFailure}`);
}

function supplierPoIds(orderId: number): number[] {
  const code = `import { getOrderRecord } from "./lib/order-records"; console.log(JSON.stringify(getOrderRecord(${orderId}).supplierPos.map((p) => p.id)));`;
  const stdout = runBun(["-e", code]);
  return JSON.parse(stdout.trim().split("\n").pop() ?? "[]") as number[];
}

test.beforeAll(() => {
  runBun(["db/seed-catalog.ts"]);
});

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

async function registerCustomer(page: Page): Promise<void> {
  const username = uniqueUsername("wf");
  const register = await page.request.post("/api/auth/register", {
    data: { j_username: username, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
  expect(register.ok()).toBe(true);
  const profile = await page.request.post("/api/customers", {
    data: {
      firstName: "Grace",
      lastName: "Hopper",
      email: `${username}@example.com`,
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
}

async function fillCart(page: Page): Promise<void> {
  for (const itemId of ["EST-1", "EST-2"]) {
    const response = await page.request.post("/api/cart", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
}

async function fillShippingAndPayment(page: Page, cardNumber: string): Promise<void> {
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
  await page.getByLabel("Card number").fill(cardNumber);
  await page.getByLabel("Expiry month").selectOption("03");
  await page.getByLabel("Expiry year").selectOption(String(CARD_YEAR));
}

async function placeOrderInBrowser(page: Page): Promise<number> {
  await registerCustomer(page);
  await fillCart(page);
  await page.goto("/checkout");
  await fillShippingAndPayment(page, GOOD_CARD);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  return Number(page.url().split("/").pop());
}

test("[SWHR3-C-0157] a browser order is placed and confirmed", async ({ page }) => {
  const orderId = await placeOrderInBrowser(page);

  await expect(
    page.getByRole("heading", { name: "Thank you — your order has been received" }),
  ).toBeVisible();
  await expect(page.getByText(String(orderId), { exact: true })).toBeVisible();
});

test("[SWHR3-C-0168] a declined test card in the browser places no order", async ({ page }) => {
  await registerCustomer(page);
  await fillCart(page);
  await page.goto("/checkout");
  await fillShippingAndPayment(page, DECLINE_CARD);

  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByText("Check your card details or use another card.")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.goto("/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(2);
});

test("[SWHR3-C-0181] approve, stock, ship and see Completed in the admin queue", async ({
  page,
}) => {
  const orderId = await placeOrderInBrowser(page);
  runBun(["db/seed-inventory.ts", "--all", "10"]);

  const admin = uniqueUsername("wfadm");
  const register = await page.request.post("/api/auth/register", {
    data: { j_username: admin, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
  expect(register.ok()).toBe(true);
  runBun(["db/grant-admin.ts", admin]);
  await page.context().clearCookies();
  await page.goto("/admin/signin");
  await page.getByLabel("User name").fill(admin);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in as administrator" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const rowFor = () =>
    page
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: String(orderId), exact: true }) });
  await page.goto("/admin/orders");
  await rowFor().getByRole("combobox").selectOption("APPROVED");
  await page.getByRole("button", { name: /^Commit 1 decision/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^Commit 1 decision/ }).click();
  await expect(dialog.getByText("1 decision committed")).toBeVisible();
  await dialog.getByRole("button", { name: "Done" }).click();

  const poIds = supplierPoIds(orderId);
  expect(poIds).toHaveLength(1);
  runBun(["db/ship-supplier-po.ts", "--po", String(poIds[0]), "--tracking", `TRK-${orderId}`]);

  await page.goto("/admin/orders");
  await page.getByRole("tab", { name: /Completed/ }).click();
  await expect(rowFor()).toHaveCount(1);
});
