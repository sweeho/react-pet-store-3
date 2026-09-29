import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

/**
 * E2E TEST
 *
 * Database lock contention tolerance (SWHR3-T-0048): the dev server shares
 * the file-backed sqlite.db with operator scripts and must wait for a
 * concurrent writer instead of answering 500 "database is locked".
 */
const PASSWORD = "correct-horse-1";

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
}

async function register(request: APIRequestContext, username: string) {
  return request.post("/api/auth/register", {
    data: { j_username: username, j_password: PASSWORD, j_password_confirm: PASSWORD },
  });
}

function runScript(
  script: string,
  args: string[],
): Promise<{ status: number | null; out: string }> {
  return new Promise((resolve) => {
    const child = spawn("bun", [script, ...args], { cwd: process.cwd() });
    let out = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.stderr.on("data", (d: Buffer) => (out += d.toString()));
    child.on("exit", (status) => resolve({ status, out }));
  });
}

// A separate Bun process holding a write transaction on sqlite.db for ~1 s.
async function holdWriteLock(): Promise<Promise<void>> {
  const script = `
    import { Database } from "bun:sqlite";
    const db = new Database("sqlite.db");
    db.exec("PRAGMA busy_timeout = 10000");
    db.exec("BEGIN IMMEDIATE");
    db.exec("UPDATE users SET name = name WHERE id = -1");
    console.log("locked");
    setTimeout(() => { db.exec("COMMIT"); process.exit(0); }, 1000);
  `;
  const child = spawn("bun", ["-e", script], { cwd: process.cwd() });
  const exited = new Promise<void>((resolve) => child.on("exit", () => resolve()));
  await new Promise<void>((resolve) =>
    child.stdout.on("data", (d: Buffer) => d.toString().includes("locked") && resolve()),
  );
  return exited;
}

async function adminRequest(request: APIRequestContext): Promise<string> {
  const username = uniqueUsername("lk");
  expect((await register(request, username)).ok()).toBe(true);
  const granted = await runScript("db/grant-admin.ts", [username]);
  expect(granted.status).toBe(0);
  const signin = await request.post("/api/auth/signin", {
    data: { j_username: username, j_password: PASSWORD },
  });
  expect(signin.status()).toBeLessThan(500);
  return username;
}

test.describe("Database lock contention (SWHR3-T-0048)", () => {
  test("[SWHR3-C-0036] admin order queue answers 200 while another process holds a write lock", async ({
    request,
  }) => {
    const username = await adminRequest(request);
    await runScript("db/seed-orders.ts", ["--username", username, "--count", "1"]);
    const released = await holdWriteLock();
    const response = await request.get("/api/admin/orders");
    const body = await response.text();
    await released;
    expect(response.status()).toBe(200);
    expect(body).not.toContain("database is locked");
  });

  test("[SWHR3-C-0037] registration during a concurrent write transaction succeeds", async ({
    request,
  }) => {
    const released = await holdWriteLock();
    const username = uniqueUsername("rg");
    const response = await register(request, username);
    await released;
    expect(response.status()).toBeLessThan(500);
    expect(response.ok()).toBe(true);
  });

  test("[SWHR3-C-0040] several operator scripts started at once alongside server requests all succeed", async ({
    request,
  }) => {
    const names = await Promise.all(
      Array.from({ length: 5 }, async () => {
        const name = uniqueUsername("op");
        expect((await register(request, name)).ok()).toBe(true);
        return name;
      }),
    );
    const scripts = Promise.all([
      ...names.map((n) => runScript("db/grant-admin.ts", [n])),
      ...names.map((n) => runScript("db/seed-orders.ts", ["--username", n, "--count", "1"])),
    ]);
    const requests = Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        request.get(i % 2 === 0 ? "/api/session" : "/api/admin/orders"),
      ),
    );
    const [results, responses] = await Promise.all([scripts, requests]);
    for (const r of results) {
      expect(r.status, r.out).toBe(0);
    }
    for (const r of responses) {
      expect(r.status()).toBeLessThan(500);
    }
  });

  test("[SWHR3-C-0039] order-approval spec carries no retries override", () => {
    const source = readFileSync("e2e/order-approval.spec.ts", "utf8");
    expect(source).not.toMatch(/retries/);
  });
});
