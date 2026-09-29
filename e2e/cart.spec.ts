import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the shopping-cart capability (design.md D1-D10) end to end in a
 * real browser against the seeded catalogue. The runner cannot load
 * bun:sqlite, so the catalogue is seeded by spawning db/seed-catalog.ts under
 * Bun, as e2e/order-approval.spec.ts does for orders. There is no catalogue UI
 * yet, so items are added through page.request, which shares the browser
 * context's petstore_cart cookie. Every test gets its own context, so its own
 * cart.
 *
 * Seeded prices: EST-1 "Angelfish / Large" 1650 cents, EST-2 "Angelfish /
 * Small" 1650 cents. Both share a name, so rows are addressed by attribute.
 */
const EMPTY_MESSAGE = "Your Shopping Cart is Empty";
const EMPTY_CHECKOUT_MESSAGE = "The Shopping Cart is Empty and the order could not be placed.";

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

async function addToCart(page: Page, itemId: string, quantity?: number): Promise<void> {
  const response = await page.request.post("/api/cart", {
    data: quantity === undefined ? { itemId } : { itemId, quantity },
  });
  expect(response.ok()).toBe(true);
}

// /checkout requires a signed-in customer (design.md D7). Registering signs the
// context in, and the cart cookie is independent of the session, so it survives.
async function signIn(page: Page): Promise<void> {
  const username = `cart${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 25);
  const password = "correct-horse-1";
  const response = await page.request.post("/api/auth/register", {
    data: { j_username: username, j_password: password, j_password_confirm: password },
  });
  expect(response.ok()).toBe(true);
}

function line(page: Page, attribute: string) {
  return page.getByTestId("cart-line").filter({ hasText: attribute });
}

async function seedTwoItems(page: Page): Promise<void> {
  await addToCart(page, "EST-1");
  await addToCart(page, "EST-2");
}

test("[SWHR3-C-0090] full cart journey from add to checkout", async ({ page }) => {
  await signIn(page);
  await page.goto("/cart");
  await expect(page.getByText(EMPTY_MESSAGE)).toBeVisible();

  await addToCart(page, "EST-1");
  await addToCart(page, "EST-2", 3);
  await page.reload();
  await expect(page.getByTestId("cart-line")).toHaveCount(2);
  await expect(line(page, "Large")).toContainText("$16.50");
  await expect(line(page, "Small").locator("input")).toHaveValue("3");
  await expect(line(page, "Small")).toContainText("$49.50");
  await expect(page.getByTestId("cart-subtotal")).toContainText("$66.00");

  await page.locator('input[name="itemQuantity_EST-1"]').fill("2");
  await page.getByRole("button", { name: "Update Cart" }).click();
  await expect(line(page, "Large").locator("input")).toHaveValue("2");
  await expect(line(page, "Large")).toContainText("$33.00");
  await expect(page.getByTestId("cart-subtotal")).toContainText("$82.50");

  await line(page, "Small").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(line(page, "Large")).toBeVisible();

  await page.getByRole("link", { name: "Check Out" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Enter Order Information" })).toBeVisible();
});

test("[SWHR3-C-0054] cart contents survive navigating away and back", async ({ page }) => {
  await page.goto("/");
  await addToCart(page, "EST-1");

  await page.goto("/");
  await page.goto("/cart");

  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(line(page, "Large").locator("input")).toHaveValue("1");
});

test("[SWHR3-C-0066] a negative quantity removes the row", async ({ page }) => {
  await page.goto("/");
  await seedTwoItems(page);
  await page.goto("/cart");

  await page.locator('input[name="itemQuantity_EST-1"]').fill("-1");
  await page.getByRole("button", { name: "Update Cart" }).click();

  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(line(page, "Small")).toBeVisible();
});

test("[SWHR3-C-0097] letters in a quantity box remove the row", async ({ page }) => {
  await page.goto("/");
  await seedTwoItems(page);
  await page.goto("/cart");

  await page.locator('input[name="itemQuantity_EST-1"]').fill("abc");
  await page.getByRole("button", { name: "Update Cart" }).click();

  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(line(page, "Small")).toBeVisible();
});

test("[SWHR3-C-0045] emptying the cart through the API shows the empty message", async ({
  page,
}) => {
  await page.goto("/");
  await seedTwoItems(page);

  const response = await page.request.delete("/api/cart");
  expect(response.ok()).toBe(true);
  await page.goto("/cart");

  await expect(page.getByText(EMPTY_MESSAGE)).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("[SWHR3-C-0092] /checkout with an empty cart is blocked", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  await seedTwoItems(page);
  const response = await page.request.delete("/api/cart");
  expect(response.ok()).toBe(true);

  await page.goto("/checkout");

  await expect(page.getByText(EMPTY_CHECKOUT_MESSAGE)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enter Order Information" })).toHaveCount(0);
});
