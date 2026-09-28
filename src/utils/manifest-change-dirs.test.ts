import fs from "node:fs";
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

  it("names a directory that actually exists on disk", () => {
    for (const dir of dirLines) {
      const resolved = path.resolve(__dirname, "../..", dir);
      expect(fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()).toBe(true);
    }
  });
});
