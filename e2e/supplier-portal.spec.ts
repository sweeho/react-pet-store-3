import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the supplier portal (supplier-portal-and-inventory design.md D1-D9)
 * in a real browser: a supplier signs in and sees the inventory, an
 * administrator is denied, a negative quantity is ignored, and a waiting
 * order is fulfilled by a supplier stock update, shipped and completed. The
 * runner cannot load bun:sqlite, so items, inventory, roles and shipments are
 * set by spawning Bun scripts, as e2e/order-workflow.spec.ts does. Each test
 * creates its own catalogue items (ids carry a random suffix) so parallel
 * specs that seed stock for the shared EST-* items cannot change what it sees.
 * Every supplier update reprocesses all pending POs, so a test only relies on
 * its own items and orders.
 */
const PASSWORD = "correct-horse-1";
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

function uniqueName(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

/** Creates a catalogue item that only this test uses, and returns its id. */
function makeItem(): string {
  const itemId =
    `SUP-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`.toUpperCase();
  const code = `
    import { db } from "./db/client";
    import { catalogItemDetails, catalogItems } from "./db/schema";
    db.insert(catalogItems).values({ itemId: "${itemId}", productId: "E2E-SUP", category: "FISH", unitCostCents: 500 }).onConflictDoNothing().run();
    db.insert(catalogItemDetails).values({ itemId: "${itemId}", locale: "en_US", name: "Supplier test fish", attribute: "Small" }).onConflictDoNothing().run();
  `;
  runBun(["-e", code]);
  return itemId;
}

function setStock(itemId: string, quantity: number): void {
  runBun(["db/seed-inventory.ts", "--item", itemId, "--quantity", String(quantity)]);
}

function supplierPoIds(orderId: number): number[] {
  const code = `import { getOrderRecord } from "./lib/order-records"; console.log(JSON.stringify(getOrderRecord(${orderId}).supplierPos.map((p) => p.id)));`;
  const stdout = runBun(["-e", code]);
  return JSON.parse(stdout.trim().split("\n").pop() ?? "[]") as number[];
}

async function register(page: Page, prefix: string): Promise<string> {
  const username = uniqueName(prefix);
  const response = await page.request.post("/api/auth/register", {
    data: { j_username: username, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
  expect(response.ok()).toBe(true);
  return username;
}

async function registerCustomerWithProfile(page: Page): Promise<void> {
  const username = await register(page, "supc");
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

/** Registers a supplier account and signs in through /supplier/signin. */
async function signInAsSupplier(page: Page): Promise<void> {
  const username = await register(page, "sups");
  runBun(["db/grant-supplier.ts", username]);
  await page.context().clearCookies();
  await page.goto("/supplier/signin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/supplier$/);
}

async function signInAsAdmin(page: Page, username: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/admin/signin");
  await page.getByLabel("User name").fill(username);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in as administrator" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

function inventoryRow(page: Page, itemId: string) {
  return page.getByTestId("inventory-row").filter({ hasText: itemId });
}

test.beforeAll(() => {
  runBun(["db/seed-catalog.ts"]);
});

test("[SWHR3-C-0186] a supplier signs in and sees the inventory table", async ({ page }) => {
  const [a, b] = [makeItem(), makeItem()];
  setStock(a, 7);
  setStock(b, 0);

  await signInAsSupplier(page);

  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await expect(inventoryRow(page, a)).toContainText("7");
  await expect(inventoryRow(page, b)).toContainText("0");
  await expect(page.locator("th", { hasText: "Item ID" })).toBeVisible();
  await expect(page.locator("th", { hasText: "Current quantity" })).toBeVisible();
  await expect(page.getByText("Supplier administrator")).toBeVisible();
});

test("[SWHR3-C-0188] a store administrator opening /supplier sees Access denied", async ({
  page,
}) => {
  const admin = await register(page, "supa");
  runBun(["db/grant-admin.ts", admin]);
  await page.context().clearCookies();
  await page.goto("/supplier/signin");
  await page.getByLabel("Username").fill(admin);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();

  await page.goto("/supplier");

  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in as a different user" })).toBeVisible();
  await expect(page.getByTestId("inventory-row")).toHaveCount(0);
});

test("[SWHR3-C-0211] entering -3 in the browser leaves that item unchanged", async ({ page }) => {
  const item = makeItem();
  setStock(item, 4);
  await signInAsSupplier(page);
  await expect(inventoryRow(page, item)).toContainText("4");

  await page.getByLabel(`New quantity for ${item}`).fill("-3");
  await page.getByRole("button", { name: "Update inventory" }).click();

  await expect(page.getByText(/^Inventory updated — /)).toBeVisible();
  await expect(inventoryRow(page, item)).toContainText("4");
  await expect(inventoryRow(page, item)).not.toContainText("updated");
});

test("[SWHR3-C-0218] a waiting order is fulfilled by a supplier stock update and completed", async ({
  page,
}) => {
  const [a, b] = [makeItem(), makeItem()];
  setStock(a, 0);
  setStock(b, 0);

  // A customer places an order for the two items.
  await registerCustomerWithProfile(page);
  for (const itemId of [a, b]) {
    const response = await page.request.post("/api/cart", { data: { itemId } });
    expect(response.ok()).toBe(true);
  }
  await page.goto("/checkout");
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
  await page.getByLabel("Card number").fill("4111 1111 1111 4412");
  await page.getByLabel("Expiry month").selectOption("03");
  await page.getByLabel("Expiry year").selectOption(String(CARD_YEAR));
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = Number(page.url().split("/").pop());

  // An administrator approves it with no stock: it waits.
  const admin = await register(page, "supa");
  runBun(["db/grant-admin.ts", admin]);
  await signInAsAdmin(page, admin);
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
  expect(supplierPoIds(orderId)).toHaveLength(1);

  // The supplier sets stock for both items, and the waiting PO is fulfilled.
  await signInAsSupplier(page);
  await page.getByLabel(`New quantity for ${a}`).fill("5");
  await page.getByLabel(`New quantity for ${b}`).fill("5");
  await page.getByRole("button", { name: "Update inventory" }).click();
  await expect(page.getByText("Inventory updated — 2 items saved.")).toBeVisible();
  await expect(
    page.getByText("Pending supplier orders are being reprocessed against the new quantities."),
  ).toBeVisible();
  await expect(inventoryRow(page, a)).toContainText("updated");

  // Shipping the PO completes the order, which the administrator sees in the Completed tab.
  const [poId] = supplierPoIds(orderId);
  runBun(["db/ship-supplier-po.ts", "--po", String(poId), "--tracking", `TRK-${orderId}`]);
  await signInAsAdmin(page, admin);
  await page.goto("/admin/orders");
  await page.getByRole("tab", { name: /Completed/ }).click();
  await expect(rowFor()).toHaveCount(1);
});
