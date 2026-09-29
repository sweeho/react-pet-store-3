import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION TEST — SWHR3-T-0023
 *
 * build/manifest.yaml's capabilities[].change.dir values are read by the
 * build pipeline to locate each capability's openspec change directory.
 * They previously held placeholder paths (openspec/changes/sx-<slug>) left
 * over from spec extraction that were never back-filled with the real
 * swhr3-i-00NN-* directories, so every one of them pointed at a directory
 * that does not exist.
 */
/**
 * A change.dir resolves when its directory exists at the stated path or,
 * once the platform has archived the change at sprint close, as
 * openspec/changes/archive/<YYYY-MM-DD>-<basename>. A placeholder path
 * (openspec/changes/sx-...) never resolves, wherever it is found.
 */
function changeDirResolves(root: string, dir: string): boolean {
  if (dir.startsWith("openspec/changes/sx-")) {
    return false;
  }

  const isDirectory = (candidate: string) =>
    fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();

  if (isDirectory(path.resolve(root, dir))) {
    return true;
  }

  const archiveRoot = path.resolve(root, "openspec/changes/archive");
  if (!isDirectory(archiveRoot)) {
    return false;
  }
  const archivedName = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${path.basename(dir)}$`);
  return fs.readdirSync(archiveRoot).some((entry) => archivedName.test(entry));
}

describe("changeDirResolves", () => {
  function makeRoot(...dirs: string[]): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-dirs-"));
    for (const dir of dirs) {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
    }
    return root;
  }

  it("accepts a directory at its stated path", () => {
    const root = makeRoot("openspec/changes/swhr3-i-0001-thing");
    expect(changeDirResolves(root, "openspec/changes/swhr3-i-0001-thing")).toBe(true);
  });

  it("accepts a directory that exists only as its dated archive", () => {
    const root = makeRoot("openspec/changes/archive/2026-09-29-swhr3-i-0001-thing");
    expect(changeDirResolves(root, "openspec/changes/swhr3-i-0001-thing")).toBe(true);
  });

  it("rejects a path found in neither place", () => {
    const root = makeRoot("openspec/changes/archive/2026-09-29-something-else");
    expect(changeDirResolves(root, "openspec/changes/swhr3-i-0001-thing")).toBe(false);
  });

  it("rejects an archive entry without a YYYY-MM-DD prefix", () => {
    const root = makeRoot("openspec/changes/archive/swhr3-i-0001-thing");
    expect(changeDirResolves(root, "openspec/changes/swhr3-i-0001-thing")).toBe(false);
  });

  it("rejects an sx- placeholder even when its directory exists", () => {
    const root = makeRoot("openspec/changes/sx-thing");
    expect(changeDirResolves(root, "openspec/changes/sx-thing")).toBe(false);
  });
});

describe("build/manifest.yaml change.dir paths", () => {
  const manifestPath = path.resolve(__dirname, "../../build/manifest.yaml");
  const manifest = fs.readFileSync(manifestPath, "utf8");
  const dirLines = [...manifest.matchAll(/^\s*dir:\s*(\S+)\s*$/gm)].map((m) => m[1]);

  it("finds all ten capability change.dir entries", () => {
    expect(dirLines).toHaveLength(10);
  });

  it("never points at the openspec/changes/sx- placeholder paths", () => {
    for (const dir of dirLines) {
      expect(dir.startsWith("openspec/changes/sx-")).toBe(false);
    }
  });

  it("names a directory that exists on disk, at its stated path or archived", () => {
    for (const dir of dirLines) {
      expect(changeDirResolves(path.resolve(__dirname, "../.."), dir)).toBe(true);
    }
  });
});
