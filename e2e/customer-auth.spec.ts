import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the merged sign-on/registration/profile capability end to end in
 * a real browser, against the real dev server and its file-backed sqlite.db
 * (db/client.ts only swaps in an in-memory db under Vitest) — the one layer
 * that proves the whole journey works together, not just each handler in
 * isolation. Every test uses its own unique user name because the database
 * persists between runs and Playwright runs fully parallel (PLAN.md).
 */
function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

function customerProfilePayload(overrides: { firstName: string; lastName: string; email: string }) {
  return {
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    email: overrides.email,
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
      expiryYear: new Date().getFullYear() + 2,
    },
    preferences: {
      locale: "en_US",
      favoriteCategory: "BIRDS",
      myListEnabled: false,
      petTipsEnabled: false,
    },
  };
}

test.describe("Customer sign-on, registration and profile (SWHR3-T-0022)", () => {
  test("register, complete the profile, sign out, sign back in with Remember my user name, and find it prefilled next time", async ({
    page,
  }) => {
    const username = uniqueUsername("journey");
    const password = "correct-horse-1";

    await page.goto("/signin");

    const newCustomerPanel = page.getByRole("region", { name: "New customer" });
    await newCustomerPanel.getByLabel("User name").fill(username);
    await newCustomerPanel.getByLabel("Password", { exact: true }).fill(password);
    await newCustomerPanel.getByLabel("Confirm password").fill(password);
    await newCustomerPanel.getByRole("button", { name: "Create new account" }).click();

    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.locator("strong", { hasText: username })).toBeVisible();

    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Street address", { exact: true }).fill("1 Analytical Engine Way");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("State / Province").fill("LDN");
    await page.getByLabel("ZIP / Postal code").fill("SW1A 1AA");
    await page.getByLabel("Country").fill("UK");
    await page.getByLabel("Telephone").fill("555-0100");
    await page.getByLabel("Email").fill(`${username}@example.com`);
    await page.getByLabel("Card number").fill("4111111111111111");
    await page.getByLabel("Favourite category").selectOption("BIRDS");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/users\/profile$/);
    await expect(page.getByLabel("First name")).toHaveValue("Ada");
    await expect(page.getByLabel("Last name")).toHaveValue("Lovelace");
    await expect(page.getByLabel("Email")).toHaveValue(`${username}@example.com`);
    await expect(page.locator("strong", { hasText: username })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/signin$/);

    const returningPanel = page.getByRole("region", { name: "Returning customer" });
    await returningPanel.getByLabel("User name").fill(username);
    await returningPanel.getByLabel("Password", { exact: true }).fill(password);
    await returningPanel.getByRole("checkbox", { name: /Remember my user name/ }).check();
    await returningPanel.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/users\/profile$/);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/signin$/);

    await page.goto("/signin");
    await expect(
      page.getByRole("region", { name: "Returning customer" }).getByLabel("User name"),
    ).toHaveValue(username);
  });

  test("a signed-out visit to /users/profile redirects to /signin and returns there after signing in", async ({
    page,
    context,
  }) => {
    const username = uniqueUsername("redirect");
    const password = "correct-horse-1";

    const registerResponse = await page.request.post("/api/auth/register", {
      data: { j_username: username, j_password: password, j_password_confirm: password },
    });
    expect(registerResponse.ok()).toBe(true);
    const createResponse = await page.request.post("/api/customers", {
      data: customerProfilePayload({
        firstName: "Grace",
        lastName: "Hopper",
        email: `${username}@example.com`,
      }),
    });
    expect(createResponse.ok()).toBe(true);
    await context.clearCookies();

    await page.goto("/users/profile");
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fusers%2Fprofile$/);

    const returningPanel = page.getByRole("region", { name: "Returning customer" });
    await returningPanel.getByLabel("User name").fill(username);
    await returningPanel.getByLabel("Password", { exact: true }).fill(password);
    await returningPanel.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/users\/profile$/);
  });

  test("a wrong password shows the exact sign-on error message", async ({ page }) => {
    const username = uniqueUsername("wrongpw");
    const password = "correct-horse-1";

    const registerResponse = await page.request.post("/api/auth/register", {
      data: { j_username: username, j_password: password, j_password_confirm: password },
    });
    expect(registerResponse.ok()).toBe(true);

    await page.goto("/signin");
    const returningPanel = page.getByRole("region", { name: "Returning customer" });
    await returningPanel.getByLabel("User name").fill(username);
    await returningPanel.getByLabel("Password", { exact: true }).fill("totally-wrong-password");
    await returningPanel.getByRole("button", { name: "Sign in" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toContainText("There were errors signing you in");
    await expect(alert).toContainText(
      "The user name and password you entered were not found in our records.",
    );
  });

  test("a duplicate user name shows the taken-user-name message", async ({ page }) => {
    const username = uniqueUsername("dupe");
    const password = "correct-horse-1";

    const registerResponse = await page.request.post("/api/auth/register", {
      data: { j_username: username, j_password: password, j_password_confirm: password },
    });
    expect(registerResponse.ok()).toBe(true);

    await page.goto("/signin");
    const newCustomerPanel = page.getByRole("region", { name: "New customer" });
    await newCustomerPanel.getByLabel("User name").fill(username);
    await newCustomerPanel.getByLabel("Password", { exact: true }).fill("another-password-1");
    await newCustomerPanel.getByLabel("Confirm password").fill("another-password-1");
    await newCustomerPanel.getByRole("button", { name: "Create new account" }).click();

    await expect(
      newCustomerPanel.getByRole("heading", { name: "That user name is already taken" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("a failed profile load renders the error screen", async ({ page }) => {
    const username = uniqueUsername("failload");
    const password = "correct-horse-1";

    const registerResponse = await page.request.post("/api/auth/register", {
      data: { j_username: username, j_password: password, j_password_confirm: password },
    });
    expect(registerResponse.ok()).toBe(true);

    await page.route("**/api/customers/me", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Internal server error",
          data: { code: "INTERNAL_ERROR" },
        }),
      }),
    );

    await page.goto("/users/profile");

    await expect(
      page.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeVisible();
  });
});
