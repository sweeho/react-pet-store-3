import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { openDatabase } from "../db/client";

/**
 * INTEGRATION TEST (server project, bun:sqlite)
 *
 * openDatabase must give every connection a 5000 ms busy timeout, WAL on the
 * file-backed db and foreign keys ON (SWHR3-T-0048).
 */
const cleanups: (() => void)[] = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

function tempDbFile(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "db-client-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, "test.db");
}

function pragma(db: ReturnType<typeof openDatabase>, name: string): unknown {
  const row = db.query(`PRAGMA ${name}`).get() as Record<string, unknown>;
  return Object.values(row)[0];
}

// Starts a separate Bun process that holds a write lock on `file` for
// `holdMs`, resolving once it reports it holds the lock.
function holdLock(file: string, holdMs: number): Promise<ChildProcess> {
  const script = `
    import { Database } from "bun:sqlite";
    const db = new Database(process.argv[1]);
    db.exec("BEGIN IMMEDIATE");
    db.exec("INSERT INTO t (v) VALUES ('child')");
    console.log("locked");
    setTimeout(() => { db.exec("COMMIT"); process.exit(0); }, ${holdMs});
  `;
  const child = spawn("bun", ["-e", script, file], { stdio: ["ignore", "pipe", "inherit"] });
  cleanups.push(() => child.kill());
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("locked")) {
        resolve(child);
      }
    });
  });
}

function prepareFile() {
  const file = tempDbFile();
  const db = openDatabase(file);
  cleanups.push(() => db.close());
  db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)");
  return { file, db };
}

describe("openDatabase", () => {
  it("[SWHR3-C-0041] carries a 5000 ms busy timeout on file and in-memory connections", () => {
    const file = openDatabase(tempDbFile());
    const memory = openDatabase(":memory:");
    cleanups.push(
      () => file.close(),
      () => memory.close(),
    );

    expect(pragma(file, "busy_timeout")).toBe(5000);
    expect(pragma(file, "journal_mode")).toBe("wal");
    expect(pragma(file, "foreign_keys")).toBe(1);
    expect(pragma(memory, "busy_timeout")).toBe(5000);
  });

  it("[SWHR3-C-0038] waits for another process's write lock and then succeeds", async () => {
    const { file, db } = prepareFile();
    const child = await holdLock(file, 1000);
    const exited = new Promise((resolve) => child.once("exit", resolve));

    const started = Date.now();
    db.exec("INSERT INTO t (v) VALUES ('parent')");
    const elapsed = Date.now() - started;
    await exited;

    expect(elapsed).toBeGreaterThan(200);
    expect(elapsed).toBeLessThan(5000);
    expect(db.query("SELECT COUNT(*) AS n FROM t").get()).toEqual({ n: 2 });
  }, 15_000);

  it("[SWHR3-C-0042] fails with 'database is locked' after about 5 s when the lock is never released in time", async () => {
    const { file, db } = prepareFile();
    await holdLock(file, 8000);

    const started = Date.now();
    expect(() => db.exec("INSERT INTO t (v) VALUES ('parent')")).toThrow(/database is locked/);
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(4500);
    expect(elapsed).toBeLessThanOrEqual(6500);
  }, 20_000);
});
