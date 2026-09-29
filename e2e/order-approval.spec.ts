import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the order-approval capability (design.md D8-D12) end to end in a
 * real browser against the real dev server and its persistent, file-backed
 * sqlite.db. The runner cannot load bun:sqlite, so accounts are promoted and
 * orders seeded by spawning the operator scripts under Bun (D12). The
 * database persists between runs and tests run fully parallel, so every test
 * registers its own account and addresses orders only by the ids its own seed
 * call returned (R1) — never by position or by a tab's count.
 */
const PASSWORD = "correct-horse-1";

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

// The scripts run db/client.ts's migrate() on import; several spawning at
// once against a cold database can hit SQLITE_BUSY, so retry briefly.
function runBun(script: string, args: string[]): string {
  let lastFailure = "";
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = spawnSync("bun", [script, ...args], { cwd: process.cwd(), encoding: "utf8" });
    if (result.status === 0) {
      return result.stdout;
    }
    lastFailure = result.stderr || result.stdout;
    if (/^No account found with user name|^Usage:/m.test(lastFailure)) {
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 150);
  }
  throw new Error(`bun ${script} ${args.join(" ")} failed: ${lastFailure}`);
}

function seedOrders(username: string, count: number): number[] {
  const stdout = runBun("db/seed-orders.ts", ["--username", username, "--count", String(count)]);
  const lastLine = stdout.trim().split("\n").pop() ?? "";
  return (JSON.parse(lastLine) as { orderIds: number[] }).orderIds;
}

async function register(request: APIRequestContext, username: string): Promise<void> {
  const response = await request.post("/api/auth/register", {
    data: { j_username: username, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
  expect(response.ok()).toBe(true);
}

async function createAdmin(request: APIRequestContext, prefix: string): Promise<string> {
  const username = uniqueUsername(prefix);
  await register(request, username);
  runBun("db/grant-admin.ts", [username]);
  return username;
}

async function signInAsAdmin(page: Page, username: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/admin/signin");
  await page.getByLabel("User name").fill(username);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in as administrator" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

function rowFor(page: Page, orderId: number) {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: String(orderId), exact: true }) });
}

async function stage(page: Page, orderId: number, status: "APPROVED" | "DENIED") {
  await rowFor(page, orderId).getByRole("combobox").selectOption(status);
}

async function openQueue(page: Page) {
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Order review" })).toBeVisible();
}

async function ordersByStatus(
  request: APIRequestContext,
): Promise<Record<string, { id: number }[]>> {
  const response = await request.get("/api/admin/orders");
  expect(response.status()).toBe(200);
  return ((await response.json()) as { orders: Record<string, { id: number }[]> }).orders;
}

test.describe("Order approval (SWHR3-I-0003)", () => {
  // db/client.ts sets no busy_timeout, so the dev server itself can answer
  // 500 "database is locked" while a spawned seed/grant script holds the
  // write lock. Retry until that is fixed server-side (follow-up defect).
  test.describe.configure({ retries: 3 });

  test("[SWHR3-C-0005] an admin stages one order as APPROVED in the browser", async ({ page }) => {
    const admin = await createAdmin(page.request, "apr5");
    const [orderId] = seedOrders(admin, 1);

    await signInAsAdmin(page, admin);
    await openQueue(page);

    await rowFor(page, orderId).getByRole("checkbox").check();
    await page.getByRole("button", { name: "Approve selected" }).click();

    const row = rowFor(page, orderId);
    await expect(row.getByRole("combobox")).toHaveValue("APPROVED");
    await expect(row.getByText("Staged")).toBeVisible();
    await expect(page.getByText("1 decision staged, not yet sent")).toBeVisible();
  });

  test("stages APPROVED on one order and DENIED on two, commits, and finds them under the decided tabs", async ({
    page,
  }) => {
    const admin = await createAdmin(page.request, "aprj");
    const [approved, deniedA, deniedB] = seedOrders(admin, 3);

    await signInAsAdmin(page, admin);
    await openQueue(page);

    await stage(page, approved, "APPROVED");
    await stage(page, deniedA, "DENIED");
    await stage(page, deniedB, "DENIED");
    await page.getByRole("button", { name: "Commit 3 decisions" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Commit 3 decisions" }).click();
    await expect(dialog.getByText("3 decisions committed")).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();

    for (const id of [approved, deniedA, deniedB]) {
      await expect(rowFor(page, id)).toHaveCount(0);
    }
    await page.getByRole("tab", { name: /Approved/ }).click();
    await expect(rowFor(page, approved)).toHaveCount(1);
    await page.getByRole("tab", { name: /Denied/ }).click();
    await expect(rowFor(page, deniedA)).toHaveCount(1);
    await expect(rowFor(page, deniedB)).toHaveCount(1);
    await page.getByRole("tab", { name: /Pending/ }).click();
    for (const id of [approved, deniedA, deniedB]) {
      await expect(rowFor(page, id)).toHaveCount(0);
    }
  });

  test("the refresh warning keeps staged decisions on cancel and discards them on 'Refresh anyway'", async ({
    page,
  }) => {
    const admin = await createAdmin(page.request, "aprr");
    const [orderId] = seedOrders(admin, 1);

    await signInAsAdmin(page, admin);
    await openQueue(page);
    await stage(page, orderId, "APPROVED");

    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Discard 1 uncommitted changes?")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel — keep my changes" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(rowFor(page, orderId).getByRole("combobox")).toHaveValue("APPROVED");
    await expect(page.getByText("1 decision staged, not yet sent")).toBeVisible();

    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Refresh anyway" }).click();

    await expect(page.getByText(/decision staged, not yet sent/)).toHaveCount(0);
    await expect(rowFor(page, orderId).getByRole("combobox")).toHaveValue("");
    await expect(rowFor(page, orderId).getByText("Staged")).toHaveCount(0);
  });

  test("a batch containing an order decided behind the page fails with the server message and leaves the rest PENDING", async ({
    page,
  }) => {
    const admin = await createAdmin(page.request, "aprf");
    const [first, decided, last] = seedOrders(admin, 3);

    await signInAsAdmin(page, admin);
    await openQueue(page);
    await stage(page, first, "APPROVED");
    await stage(page, decided, "APPROVED");
    await stage(page, last, "APPROVED");

    const behind = await page.request.post("/api/admin/orders/status", {
      data: { requestType: "UPDATESTATUS", changes: [{ orderId: decided, status: "DENIED" }] },
    });
    expect(behind.status()).toBe(200);

    await page.getByRole("button", { name: "Commit 3 decisions" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Commit 3 decisions" }).click();

    await expect(dialog.getByText("Nothing was saved")).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText(`Order ${decided} is DENIED`);
    await dialog.getByRole("button", { name: "Close" }).click();

    const orders = await ordersByStatus(page.request);
    const pendingIds = orders.PENDING.map((order) => order.id);
    expect(pendingIds).toContain(first);
    expect(pendingIds).toContain(last);
    expect(orders.DENIED.map((order) => order.id)).toContain(decided);
  });

  test("a non-admin sees the not-an-administrator state and the admin API answers 403", async ({
    page,
  }) => {
    const customer = uniqueUsername("aprn");
    await register(page.request, customer);

    await page.goto("/admin/orders");

    await expect(page).toHaveURL(/\/admin\/signin/);
    await expect(page.getByText("This account is not an administrator")).toBeVisible();
    const response = await page.request.get("/api/admin/orders");
    expect(response.status()).toBe(403);
  });

  test("[SWHR3-C-0035] Refresh with nothing staged shows an order approved behind the page under Approved", async ({
    page,
  }) => {
    const admin = await createAdmin(page.request, "apr35");
    const [orderId] = seedOrders(admin, 1);

    await signInAsAdmin(page, admin);
    await openQueue(page);
    await expect(rowFor(page, orderId)).toHaveCount(1);

    const behind = await page.request.post("/api/admin/orders/status", {
      data: { requestType: "UPDATESTATUS", changes: [{ orderId, status: "APPROVED" }] },
    });
    expect(behind.status()).toBe(200);

    await page.getByRole("button", { name: "Refresh", exact: true }).click();

    await expect(rowFor(page, orderId)).toHaveCount(0);
    await page.getByRole("tab", { name: /Approved/ }).click();
    await expect(rowFor(page, orderId)).toHaveCount(1);
  });

  test("[SWHR3-C-0028] sign-in issues the httpOnly SameSite=Lax session cookie the admin client carries", async ({
    request,
  }) => {
    const admin = await createAdmin(request, "apr28");

    const response = await request.post("/api/auth/signin", {
      data: { j_username: admin, j_password: PASSWORD, j_remember_username: false },
    });
    expect(response.ok()).toBe(true);

    const cookie = response
      .headersArray()
      .find(
        (header) =>
          header.name.toLowerCase() === "set-cookie" &&
          header.value.startsWith("petstore_session="),
      );
    expect(cookie).toBeDefined();
    expect(cookie?.value).toMatch(/HttpOnly/i);
    expect(cookie?.value).toMatch(/SameSite=Lax/i);

    const session = await request.get("/api/session");
    const body = (await session.json()) as { user: { username: string; role: string } };
    expect(body.user.username).toBe(admin);
    expect(body.user.role).toBe("admin");
  });
});
