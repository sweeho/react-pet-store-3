import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION TEST — SWHR3-T-0024
 *
 * The project is CSS-first Tailwind v4: tailwindcss() is wired into
 * vite.config.ts with no arguments and src/index.css imports Tailwind
 * directly, so no tailwind.config.* file should exist at the repo root.
 * A zero-byte tailwind.config.ts previously lingered from the initial
 * commit, contradicting that convention, with components.json's shadcn
 * `tailwind.config` key still naming it.
 */
describe("CSS-first Tailwind convention", () => {
  const repoRoot = path.resolve(__dirname, "../..");

  it("has no tailwind.config.* file at the repository root", () => {
    const matches = fs.readdirSync(repoRoot).filter((name) => /^tailwind\.config\./.test(name));
    expect(matches).toEqual([]);
  });

  it("blanks components.json's shadcn tailwind.config to the documented v4 value", () => {
    const componentsJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "components.json"), "utf8"),
    );
    expect(componentsJson.tailwind.config).toBe("");
    expect(componentsJson.tailwind.css).toBe("src/index.css");
  });
});
